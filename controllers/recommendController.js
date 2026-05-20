// controllers/recommendController.js
const recommendService = require('../services/recommendService');

/**
 * (기존) 프로필/기타 추천용 엔드포인트일 수 있음
 * 반환 형식은 기존과의 호환 유지: recommended 배열 그대로 반환
 */
exports.getRecommendedChallenges = async (req, res) => {
  try {
    console.log('✅ req.user:', req.user);

    // Sequelize 세션 객체에서 user_id 추출
    const userId =
      req.user?.dataValues?.user_id ??
      req.user?.user_id ??
      req.user?.id;

    if (!userId) {
      console.warn('❌ userId를 찾을 수 없습니다.');
      return res.status(400).json({ message: 'userId를 찾을 수 없습니다.' });
    }

    const recommended = await recommendService.getRecommendedChallenges(userId);
    // 기존과 동일하게 배열 그대로 반환(역호환)
    return res.json(recommended);
  } catch (err) {
    console.error('🔥 추천 실패:', err);
    return res.status(500).json({ message: '추천에 실패했습니다.' });
  }
};

/**
 * (신규) 활동이력 기반 추천: 프론트는 바디 없이 호출해도 됨
 * 백엔드가 userId 기반으로 userText/challenges 생성 → Flask 호출
 * 프론트가 바로 쓰기 좋게 { items } 형태로 반환
 */
exports.recommendByHistory = async (req, res) => {
  try {
    console.log('✅ req.user:', req.user);

    const userId =
      req.user?.dataValues?.user_id ??
      req.user?.user_id ??
      req.user?.id;

    if (!userId) {
      console.warn('❌ userId를 찾을 수 없습니다.');
      return res.status(400).json({ message: 'userId를 찾을 수 없습니다.' });
    }

    const recommended = await recommendService.getRecommendedChallenges(userId);
    return res.json({ items: recommended });
  } catch (err) {
    console.error('🔥 활동이력 기반 추천 실패:', err);
    const detail = err.response?.data || err.message;
    return res.status(500).json({ message: '추천에 실패했습니다.', detail });
  }
};
