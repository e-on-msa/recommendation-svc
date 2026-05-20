//services/recommendService.js
const generateUserSummaryText = require('../utils/generateUserSummary');
const mypageService = require('./mypageService');
const { User, Challenge, SelectInterests, SelectVisions, Interests, Visions } = require('../models');
const callEmbeddingRecommendation = require('./embeddingApi'); 

exports.getRecommendedChallenges = async (userId) => {
  // 활동 이력 수집
  const [participated, created, posts, comments, boardRequests] = await Promise.all([
    mypageService.getActivityByType(userId, 'challenge'),
    mypageService.getActivityByType(userId, 'challengeCreated'),
    mypageService.getActivityByType(userId, 'post'),
    mypageService.getActivityByType(userId, 'comment'),
    mypageService.getActivityByType(userId, 'boardRequest'),
  ]);

  // ✅ 관심사, 진로희망은 따로 조회해야 함
  const [interests, visions] = await Promise.all([
    SelectInterests.findAll({
      where: { user_id: userId },
      include: [{ model: Interests, attributes: ['interest_detail'] }]
    }),
    SelectVisions.findAll({
      where: { user_id: userId },
      include: [{ model: Visions, attributes: ['vision_detail'] }]
    })
  ]);

  const interestNames = interests.map(i => i.Interest?.interest_detail).filter(Boolean);
  const visionNames = visions.map(v => v.Vision?.vision_detail).filter(Boolean);

  const interest = interestNames.length ? interestNames.join(', ') : '정보 없음'; 
  const vision = visionNames.length ? visionNames.join(', ') : '정보 없음'; 

  // 사용자 설명 문장 생성
  const userText = generateUserSummaryText({
    participated: participated.items,
    created: created.items,
    posts: posts.items,
    comments: comments.items,
    boardRequests: boardRequests.items,
    interest,
    vision,
  });

  //console.log('🧪 created:', JSON.stringify(created.items.slice(0, 2), null, 2));

  // 챌린지 리스트 불러오기
const allChallenges = await Challenge.findAll({
    attributes: ['challenge_id', 'title', 'description'], // ✅ 수정됨: 'id' → 'challenge_id', 'challenge_title' → 'title'
    include: [
      {
        model: Interests,
        as: 'interests',
        attributes: ['interest_detail'],
        through: { attributes: [] }, // ✅ 중간 테이블 제거
      },
      {
        model: Visions,
        as: 'visions',
        attributes: ['vision_detail'],
        through: { attributes: [] },
      },
    ]
  });

  // 챌린지 설명 텍스트 생성
  const challengeTexts = allChallenges.map(ch => ({
    id: ch.challenge_id, // 
    text: `챌린지 제목: ${ch.title}. 설명: ${ch.description}. 관심분야: ${ch.interests.map(i => i.interest_detail).join(', ')}. 진로: ${ch.visions.map(v => v.vision_detail).join(', ')}` // ✅ interest/vision 필드 직접 구성
  }));

console.log('📦 userText:', userText);
console.log('📦 challengeTexts:', challengeTexts);

  // AI 추천 API 호출
  const recommendedIds = await callEmbeddingRecommendation(userText, challengeTexts);

  const idOrder = new Map(recommendedIds.map((id, idx) => [String(id), idx]));
const ordered = allChallenges
  .filter(c => recommendedIds.includes(c.challenge_id))
  .sort((a, b) => idOrder.get(String(a.challenge_id)) - idOrder.get(String(b.challenge_id)));

return ordered;

};
