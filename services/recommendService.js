const axios = require('axios');
const generateUserSummaryText = require('../utils/generateUserSummary');
const callEmbeddingRecommendation = require('./embeddingApi');

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
exports.recalculateForUser = async (userId) => {
  console.log(`[recommendService] recalculate triggered for userId: ${userId}`);
  // TODO: 재계산 후 Redis에 저장
};

exports.addChallengeCandidate = async (challengeId) => {
  console.log(`[recommendService] add candidate: ${challengeId}`);
  // TODO: 후보 저장소 추가
};

exports.updateChallengeCandidate = async (challengeId) => {
  console.log(`[recommendService] update candidate: ${challengeId}`);
  // TODO: 후보 저장소 갱신
};

exports.removeChallengeCandidate = async (challengeId) => {
  console.log(`[recommendService] remove candidate: ${challengeId}`);
  // TODO: 후보 저장소 제거
};
