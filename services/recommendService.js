const axios = require('axios');
const { Op } = require('sequelize');
const generateUserSummaryText = require('../utils/generateUserSummary');
const callEmbeddingRecommendation = require('./embeddingApi');
const { RecommendationCache } = require('../models');

const CHALLENGE_SVC = process.env.CHALLENGE_SERVICE_URL;
const USER_SVC     = process.env.USER_SERVICE_URL;
const COMMUNITY_SVC = process.env.COMMUNITY_SERVICE_URL;

exports.getRecommendedChallenges = async (userId) => {
  // 각 서비스에서 병렬로 데이터 수집
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
    participated,
    created,
    posts,
    comments,
    boardRequests,
    interest,
    vision,
  });

  const challengeTexts = activeChallenges.map(ch => ({
    id: ch.challenge_id,
    text: `챌린지 제목: ${ch.title}. 설명: ${ch.description}. 관심분야: ${(ch.interests || []).join(', ')}. 진로: ${(ch.visions || []).join(', ')}`,
  }));

  const recommendedIds = await callEmbeddingRecommendation(userText, challengeTexts);

  const idOrder = new Map(recommendedIds.map((id, idx) => [String(id), idx]));
  return activeChallenges
    .filter(c => recommendedIds.includes(c.challenge_id))
    .sort((a, b) => idOrder.get(String(a.challenge_id)) - idOrder.get(String(b.challenge_id)));
};

// RabbitMQ 이벤트 핸들러에서 호출하는 함수들

// 유저 관심사/진로 변경 시 해당 유저의 추천 결과를 재계산해서 DB 캐시에 저장
exports.recalculateForUser = async (userId) => {
  try {
    console.log(`[recommendService] recalculate triggered for userId: ${userId}`);
    const challenges = await exports.getRecommendedChallenges(userId);
    const challengeIds = challenges.map(c => c.challenge_id);
    await RecommendationCache.upsert({
      user_id: userId,
      challenge_ids: challengeIds,
      updated_at: new Date(),
    });
    console.log(`[recommendService] cached ${challengeIds.length} recommendations for user ${userId}`);
  } catch (err) {
    console.error(`[recommendService] recalculate failed for user ${userId}:`, err.message);
  }
};

// 새 챌린지 추가 시 — 기존 캐시는 유효하므로 아무것도 하지 않음
// 다음 요청 시 자연스럽게 새 챌린지가 포함되어 재계산됨
exports.addChallengeCandidate = async (challengeId) => {
  console.log(`[recommendService] new challenge ${challengeId} registered — cache remains valid`);
};

// 챌린지 정보 변경 시 — 해당 챌린지가 캐싱된 유저들의 캐시를 무효화
exports.updateChallengeCandidate = async (challengeId) => {
  try {
    console.log(`[recommendService] challenge ${challengeId} updated — invalidating affected caches`);
    const affected = await RecommendationCache.findAll({
      where: {
        challenge_ids: { [Op.like]: `%${challengeId}%` },
      },
    });
    if (affected.length > 0) {
      await RecommendationCache.destroy({
        where: { user_id: { [Op.in]: affected.map(r => r.user_id) } },
      });
      console.log(`[recommendService] invalidated ${affected.length} cache(s) for updated challenge ${challengeId}`);
    }
  } catch (err) {
    console.error(`[recommendService] updateChallengeCandidate failed:`, err.message);
  }
};

// 챌린지 삭제/비활성화 시 — 해당 챌린지가 캐시에 있으면 즉시 제거
exports.removeChallengeCandidate = async (challengeId) => {
  try {
    console.log(`[recommendService] removing challenge ${challengeId} from all caches`);
    const affected = await RecommendationCache.findAll({
      where: {
        challenge_ids: { [Op.like]: `%${challengeId}%` },
      },
    });
    for (const row of affected) {
      const filtered = (row.challenge_ids || []).filter(
        id => String(id) !== String(challengeId)
      );
      await row.update({ challenge_ids: filtered, updated_at: new Date() });
    }
    console.log(`[recommendService] removed challenge ${challengeId} from ${affected.length} cache(s)`);
  } catch (err) {
    console.error(`[recommendService] removeChallengeCandidate failed:`, err.message);
  }
};
