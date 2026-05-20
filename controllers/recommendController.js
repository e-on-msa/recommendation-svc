const recommendService = require('../services/recommendService');

exports.getRecommendedChallenges = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(400).json({ message: 'userId를 찾을 수 없습니다.' });
    }
    const recommended = await recommendService.getRecommendedChallenges(userId);
    return res.json(recommended);
  } catch (err) {
    console.error('추천 실패:', err);
    return res.status(500).json({ message: '추천에 실패했습니다.' });
  }
};

exports.recommendByHistory = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(400).json({ message: 'userId를 찾을 수 없습니다.' });
    }
    const recommended = await recommendService.getRecommendedChallenges(userId);
    return res.json({ items: recommended });
  } catch (err) {
    console.error('활동이력 기반 추천 실패:', err);
    const detail = err.response?.data || err.message;
    return res.status(500).json({ message: '추천에 실패했습니다.', detail });
  }
};
