const recommendService = require('../services/recommendService');

// GET /api/recommend — 관심사·진로 기반 AI 임베딩 추천
exports.getRecommendedChallenges = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(400).json({ message: 'userId를 찾을 수 없습니다.' });

    const items = await recommendService.getRecommendedChallenges(userId);
    return res.status(200).json(items);
  } catch (err) {
    console.error('[recommend] 추천 실패:', err.message);
    return res.status(500).json({ message: '추천에 실패했습니다.' });
  }
};

// POST /api/recommend/history — 활동이력 기반 AI 임베딩 추천
exports.recommendByHistory = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(400).json({ message: 'userId를 찾을 수 없습니다.' });

    const items = await recommendService.recommendByHistory(userId);
    return res.status(200).json({ items });
  } catch (err) {
    console.error('[recommend/history] 활동이력 기반 추천 실패:', err.message);
    return res.status(500).json({ message: '추천에 실패했습니다.', detail: err.response?.data || err.message });
  }
};
