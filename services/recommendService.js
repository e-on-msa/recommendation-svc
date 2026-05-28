const axios = require('axios');
const { Op, literal } = require('sequelize');
const generateUserSummaryText = require('../utils/generateUserSummary');
const callEmbeddingRecommendation = require('./embeddingApi');
const { RecommendationCache } = require('../models');
const redis = require('../config/redis');

const CHALLENGE_SVC  = process.env.CHALLENGE_SERVICE_URL;
const USER_SVC       = process.env.USER_SERVICE_URL;
const COMMUNITY_SVC  = process.env.COMMUNITY_SERVICE_URL;

const CACHE_TTL = 60 * 60 * 24; // 24시간

function cacheKey(userId) {
  return `recommend:${userId}`;
}

// 공통: 활성 챌린지 텍스트 변환
function toChallengeTexts(challenges) {
  return challenges.map(ch => ({
    id: ch.challenge_id,
    text: `챌린지 제목: ${ch.title}. 설명: ${ch.description}. 관심분야: ${(ch.interests || []).join(', ')}. 진로: ${(ch.visions || []).join(', ')}`,
  }));
}

// 공통: 추천 ID 순서대로 정렬
function sortByRecommendedOrder(challenges, recommendedIds) {
  const idOrder = new Map(recommendedIds.map((id, idx) => [String(id), idx]));
  return challenges
    .filter(c => recommendedIds.includes(c.challenge_id))
    .sort((a, b) => idOrder.get(String(a.challenge_id)) - idOrder.get(String(b.challenge_id)));
}

// GET /api/recommend — 관심사·진로 기반 AI 임베딩 추천
exports.getRecommendedChallenges = async (userId) => {
  const [preferences, activeChallenges] = await Promise.all([
    axios.get(`${USER_SVC}/internal/preferences/user/${userId}`).then(r => r.data),
    axios.get(`${CHALLENGE_SVC}/internal/challenges/active-with-categories`).then(r => r.data),
  ]);

  const { interests = [], visions = [] } = preferences;
  const interest = interests.length ? interests.join(', ') : '정보 없음';
  const vision   = visions.length   ? visions.join(', ')   : '정보 없음';

  const userText = `관심분야: ${interest}. 진로희망: ${vision}.`;

  const recommendedIds = await callEmbeddingRecommendation(userText, toChallengeTexts(activeChallenges));
  return sortByRecommendedOrder(activeChallenges, recommendedIds);
};

// POST /api/recommend/history — 활동이력 기반 AI 임베딩 추천
exports.recommendByHistory = async (userId) => {
  // Redis 캐시 확인
  const cached = await redis.get(cacheKey(userId));
  if (cached) {
    console.log(`[recommendService] cache hit for userId: ${userId}`);
    return JSON.parse(cached);
  }

  const [challengeActivity, preferences, communityActivity, activeChallenges] = await Promise.all([
    axios.get(`${CHALLENGE_SVC}/internal/participations/user/${userId}`).then(r => r.data),
    axios.get(`${USER_SVC}/internal/preferences/user/${userId}`).then(r => r.data),
    axios.get(`${COMMUNITY_SVC}/internal/activities/user/${userId}`).then(r => r.data),
    axios.get(`${CHALLENGE_SVC}/internal/challenges/active-with-categories`).then(r => r.data),
  ]);

  const { participated = [], created = [] } = challengeActivity;
  const { interests = [], visions = [] } = preferences;
  const { posts = [], comments = [], boardRequests = [] } = communityActivity;

  const interest = interests.length ? interests.join(', ') : '정보 없음';
  const vision   = visions.length   ? visions.join(', ')   : '정보 없음';

  const userText = generateUserSummaryText({
    participated, created, posts, comments, boardRequests, interest, vision,
  });

  const recommendedIds = await callEmbeddingRecommendation(userText, toChallengeTexts(activeChallenges));
  const result = sortByRecommendedOrder(activeChallenges, recommendedIds);

  // Redis에 캐시 저장 (24시간 TTL)
  await redis.setex(cacheKey(userId), CACHE_TTL, JSON.stringify(result));
  console.log(`[recommendService] cache stored for userId: ${userId}`);

  return result;
};

// RabbitMQ 이벤트 핸들러에서 호출하는 함수들

// 유저 관심사/진로 변경 시 Redis 캐시 삭제 후 재계산해서 저장
exports.recalculateForUser = async (userId) => {
  try {
    console.log(`[recommendService] recalculate triggered for userId: ${userId}`);

    // 기존 캐시 삭제 후 재계산 (recommendByHistory 내부에서 Redis 저장)
    await redis.del(cacheKey(userId));
    const challenges = await exports.recommendByHistory(userId);

    // DB에도 challenge_ids 인덱스 저장 (챌린지별 무효화용)
    const challengeIds = challenges.map(c => c.challenge_id);
    await RecommendationCache.upsert({
      user_id: userId,
      challenge_ids: challengeIds,
      updated_at: new Date(),
    });
    console.log(`[recommendService] recalculated and cached ${challengeIds.length} recommendations for user ${userId}`);
  } catch (err) {
    console.error(`[recommendService] recalculate failed for user ${userId}:`, err.message);
  }
};

// 새 챌린지 추가 시 — 기존 캐시는 유효하므로 아무것도 하지 않음
// 다음 요청 시 자연스럽게 새 챌린지가 포함되어 재계산됨
exports.addChallengeCandidate = async (challengeId) => {
  console.log(`[recommendService] new challenge ${challengeId} registered — cache remains valid`);
};

// 챌린지 정보 변경 시 — 해당 챌린지가 캐싱된 유저들의 Redis + DB 캐시 무효화
exports.updateChallengeCandidate = async (challengeId) => {
  try {
    console.log(`[recommendService] challenge ${challengeId} updated — invalidating affected caches`);
    const affected = await RecommendationCache.findAll({
      where: literal(`JSON_CONTAINS(challenge_ids, '${Number(challengeId)}')`),
    });
    if (affected.length > 0) {
      const userIds = affected.map(r => r.user_id);
      // Redis 캐시 삭제
      await Promise.all(userIds.map(uid => redis.del(cacheKey(uid))));
      // DB 인덱스 삭제
      await RecommendationCache.destroy({ where: { user_id: { [Op.in]: userIds } } });
      console.log(`[recommendService] invalidated ${affected.length} cache(s) for updated challenge ${challengeId}`);
    }
  } catch (err) {
    console.error(`[recommendService] updateChallengeCandidate failed:`, err.message);
  }
};

// 챌린지 삭제/비활성화 시 — 해당 챌린지를 캐시에서 즉시 제거
exports.removeChallengeCandidate = async (challengeId) => {
  try {
    console.log(`[recommendService] removing challenge ${challengeId} from all caches`);
    const affected = await RecommendationCache.findAll({
      where: literal(`JSON_CONTAINS(challenge_ids, '${Number(challengeId)}')`),
    });
    for (const row of affected) {
      const filtered = (row.challenge_ids || []).filter(id => String(id) !== String(challengeId));
      await row.update({ challenge_ids: filtered, updated_at: new Date() });
      // Redis 캐시도 삭제 (다음 요청 시 재계산)
      await redis.del(cacheKey(row.user_id));
    }
    console.log(`[recommendService] removed challenge ${challengeId} from ${affected.length} cache(s)`);
  } catch (err) {
    console.error(`[recommendService] removeChallengeCandidate failed:`, err.message);
  }
};
