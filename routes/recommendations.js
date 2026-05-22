// routes/recommendations.js
//
// [MSA 전환 예정] 이 라우터의 SQL 쿼리는 challenge-svc / user-svc 의 테이블을
// 직접 조회하고 있어 MSA 원칙에 위반됩니다.
// 추후 challenge-svc, user-svc 의 /internal API 호출로 교체 예정입니다.
// 관련 이슈: https://github.com/<org>/recommendation-svc/issues
//
const express = require('express');
const router = express.Router();
const { sequelize } = require('../database/db');
const { QueryTypes } = require('sequelize');

/** 내부 공통 쿼리 템플릿 */
const baseSelect = ({
  withMatch = true,        // 관심/진로 매칭 사용 여부
  withAge = true,          // 나이 필터 사용 여부
  withDate = true,         // 마감/종료일 필터 사용 여부
} = {}) => `
  SELECT
    c.challenge_id, c.challenge_title, c.challenge_description,
    c.minimum_age, c.maximum_age, c.challenge_state,
    c.start_date, c.end_date, c.application_deadline,
    c.is_recuming, c.intermediate_participation,
    COALESCE(pc.participant_count, 0) AS participants,
    COALESCE(rv.avg_rating, 3.0) AS avg_rating,
    CASE
      WHEN mi.matched = 1 AND mv.matched = 1 THEN 2
      WHEN mi.matched = 1 OR mv.matched = 1 THEN 1
      ELSE 0
    END AS match_score,
    (
      CASE
        WHEN mi.matched = 1 AND mv.matched = 1 THEN 2
        WHEN mi.matched = 1 OR mv.matched = 1 THEN 1
        ELSE 0
      END
      + GREATEST(LOG(COALESCE(pc.participant_count, 0) + 1) * 0.5, 0.5)
      + COALESCE(rv.avg_rating, 3.0) * 0.3
    ) AS total_score
  FROM Challenge c
  /* 관심사 매칭 */
  LEFT JOIN (
    SELECT DISTINCT ci.challenge_id, 1 AS matched
    FROM Challenge_Interest ci
    INNER JOIN SelectInterests si ON ci.interest_id = si.interest_id
    WHERE si.user_id = :userId
  ) mi ON c.challenge_id = mi.challenge_id
  /* 진로 매칭 */
  LEFT JOIN (
    SELECT DISTINCT cv.challenge_id, 1 AS matched
    FROM Challenge_Vision cv
    INNER JOIN SelectVisions sv ON cv.vision_id = sv.vision_id
    WHERE sv.user_id = :userId
  ) mv ON c.challenge_id = mv.challenge_id
  /* 참여자 수 */
  LEFT JOIN (
    SELECT challenge_id, COUNT(*) AS participant_count
    FROM ParticipatingChallenge
    WHERE participating_state IN ('신청', '진행 중')
    GROUP BY challenge_id
  ) pc ON c.challenge_id = pc.challenge_id
  /* 평균 별점 */
  LEFT JOIN (
    SELECT challenge_id, AVG(rating_stars) AS avg_rating
    FROM Review
    GROUP BY challenge_id
  ) rv ON c.challenge_id = rv.challenge_id
  WHERE
    c.challenge_state = 'ACTIVE'
    ${withDate ? `AND (c.application_deadline IS NULL OR c.application_deadline >= NOW())
                 AND (c.end_date IS NULL OR c.end_date >= NOW())` : ''}
    ${withMatch ? `AND (mi.matched = 1 OR mv.matched = 1)` : ''}
    ${withAge ? `AND (c.minimum_age IS NULL OR c.minimum_age <= :age)
                 AND (c.maximum_age IS NULL OR c.maximum_age >= :age)` : ''}
  ORDER BY total_score DESC, c.start_date ASC, c.challenge_id DESC
  LIMIT :limit OFFSET :offset
`;

async function runRecommend({ userId, age, limit, offset, debug }) {
  // 1) 상태+기간+매칭+나이 (가장 엄격)
  let items = await sequelize.query(
    baseSelect({ withMatch: true, withAge: true, withDate: true }),
    { replacements: { userId, age, limit, offset }, type: QueryTypes.SELECT }
  );
  let stage = 'strict(match+age+date)';

  // 2) 상태+기간+매칭 (나이 완화)
  if (items.length === 0) {
    items = await sequelize.query(
      baseSelect({ withMatch: true, withAge: false, withDate: true }),
      { replacements: { userId, limit, offset }, type: QueryTypes.SELECT }
    );
    stage = 'fallback(match+date)';
  }

  // 3) 상태+기간 (매칭 제거 → 인기순)
  if (items.length === 0) {
    items = await sequelize.query(
      baseSelect({ withMatch: false, withAge: false, withDate: true }),
      { replacements: { userId, limit, offset }, type: QueryTypes.SELECT }
    );
    stage = 'fallback(date-only)';
  }

  if (!debug) return { items, stage };

  // 디버그 메타 수집
  const [selIntCnt] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM SelectInterests WHERE user_id = :userId',
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  const [selVisCnt] = await sequelize.query(
    'SELECT COUNT(*) AS cnt FROM SelectVisions WHERE user_id = :userId',
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  const [matchIntCnt] = await sequelize.query(
    `SELECT COUNT(DISTINCT ci.challenge_id) AS cnt
     FROM Challenge_Interest ci
     JOIN SelectInterests si ON ci.interest_id = si.interest_id
     WHERE si.user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  const [matchVisCnt] = await sequelize.query(
    `SELECT COUNT(DISTINCT cv.challenge_id) AS cnt
     FROM Challenge_Vision cv
     JOIN SelectVisions sv ON cv.vision_id = sv.vision_id
     WHERE sv.user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  const [activeCnt] = await sequelize.query(
    `SELECT COUNT(*) AS cnt
     FROM Challenge c
     WHERE c.challenge_state = 'ACTIVE'
       AND (c.application_deadline IS NULL OR c.application_deadline >= NOW())
       AND (c.end_date IS NULL OR c.end_date >= NOW())`,
    { type: QueryTypes.SELECT }
  );

  return {
    items,
    stage,
    debug: {
      selectInterests: selIntCnt.cnt,
      selectVisions: selVisCnt.cnt,
      matchedByInterests: matchIntCnt.cnt,
      matchedByVisions: matchVisCnt.cnt,
      activeAndOpenChallenges: activeCnt.cnt,
    },
  };
}

/**
 * @swagger
 * /api/recommendations/{userId}:
 *   get:
 *     summary: 점수 기반 챌린지 추천 (특정 유저)
 *     description: |
 *       관심사·진로 매칭 + 참여자 수 + 평균 별점을 종합 점수로 계산하여 추천합니다.
 *       매칭 결과가 없을 경우 나이 필터 완화 → 전체 인기순으로 단계적 폴백합니다.
 *     tags: [점수 기반 추천]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 추천 대상 유저 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: 반환 개수 (최대 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 페이지 오프셋
 *       - in: query
 *         name: debug
 *         schema:
 *           type: string
 *           enum: ['0', '1']
 *           default: '0'
 *         description: "1이면 매칭 통계 포함 (개발용)"
 *     responses:
 *       200:
 *         description: 추천 챌린지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScoredChallenge'
 *       400:
 *         description: 유효하지 않은 userId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 유저 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const debug = req.query.debug === '1';

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: '유효하지 않은 사용자 ID' });
  }

  try {
    const userRows = await sequelize.query(
      'SELECT age FROM `User` WHERE user_id = :userId',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });
    const age = Number(user.age);

    const { items, stage, debug: meta } = await runRecommend({ userId, age, limit, offset, debug });
    return res.status(200).json({
      count: items.length,
      items,
      ...(debug ? { debug: { userAge: age, stage, ...meta } } : {}),
    });
  } catch (err) {
    console.error('추천 오류:', err);
    return res.status(500).json({ message: '추천 실패', dev: err.message });
  }
});

/**
 * @swagger
 * /api/recommendations/me/self:
 *   get:
 *     summary: 점수 기반 챌린지 추천 (로그인 유저 본인)
 *     description: X-User-Id 헤더의 유저 ID로 본인 추천 결과를 반환합니다.
 *     tags: [점수 기반 추천]
 *     security:
 *       - UserIdHeader: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: debug
 *         schema:
 *           type: string
 *           enum: ['0', '1']
 *           default: '0'
 *     responses:
 *       200:
 *         description: 추천 챌린지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScoredChallenge'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me/self', async (req, res) => {
  try {
    const userId =
      req.user?.user_id ?? req.session?.passport?.user?.user_id ?? req.session?.user_id;
    if (!userId) return res.status(401).json({ message: '로그인 필요' });

    // 나이 조회
    const userRows = await sequelize.query(
      'SELECT age FROM `User` WHERE user_id = :userId',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const user = userRows[0];
    if (!user) return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });

    const age = Number(user.age);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;
    const debug = req.query.debug === '1';

    const { items, stage, debug: meta } = await runRecommend({ userId, age, limit, offset, debug });
    return res.status(200).json({
      count: items.length,
      items,
      ...(debug ? { debug: { userAge: age, stage, ...meta } } : {}),
    });
  } catch (err) {
    console.error('추천 오류(me):', err);
    return res.status(500).json({ message: '추천 실패', dev: err.message });
  }
});

module.exports = router;
