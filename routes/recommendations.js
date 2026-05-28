const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');
const profileRecommendService = require('../services/profileRecommendService');

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
 *       400:
 *         description: 유효하지 않은 userId
 *       500:
 *         description: 서버 오류
 */
router.get('/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  const limit  = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;
  const debug  = req.query.debug === '1';

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: '유효하지 않은 사용자 ID' });
  }

  try {
    const { items, stage, userAge } = await profileRecommendService.recommend({ userId, limit, offset });
    return res.status(200).json({
      count: items.length,
      items,
      ...(debug ? { debug: { userAge, stage } } : {}),
    });
  } catch (err) {
    console.error('[recommendations] 추천 오류:', err.message);
    return res.status(500).json({ message: '추천 실패' });
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
 *     responses:
 *       200:
 *         description: 추천 챌린지 목록
 *       401:
 *         description: 로그인 필요
 *       500:
 *         description: 서버 오류
 */
router.get('/me/self', isLoggedIn, async (req, res) => {
  const userId = req.user.user_id;
  const limit  = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;

  try {
    const { items } = await profileRecommendService.recommend({ userId, limit, offset });
    return res.status(200).json({ count: items.length, items });
  } catch (err) {
    console.error('[recommendations/me] 추천 오류:', err.message);
    return res.status(500).json({ message: '추천 실패' });
  }
});

module.exports = router;
