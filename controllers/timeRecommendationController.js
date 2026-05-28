const svc = require('../services/timeRecommendationService');

// GET /api/time-recommendations?month=3&schoolType=elementary&grade=5
exports.getRecommendationsByTime = async (req, res) => {
  const { grade, month, schoolType } = req.query;

  if (!month || !schoolType) {
    return res.status(400).json({ message: 'month와 schoolType은 필수입니다.' });
  }

  const parsedMonth = parseInt(month, 10);
  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return res.status(400).json({ message: 'month는 1~12 사이 숫자여야 합니다.' });
  }

  const parsedGrade = parseInt(grade, 10);
  const finalGrade = isNaN(parsedGrade) ? undefined : parsedGrade;

  try {
    const items = await svc.getByGradeAndMonth(finalGrade, parsedMonth, schoolType);
    return res.status(200).json({ count: items.length, items });
  } catch (err) {
    console.error('[timeRecommend] getRecommendationsByTime error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
};

// POST /api/time-recommendations/admin
exports.createItem = async (req, res) => {
  const { title, description, month, targetGrade, schoolType, challengeId, imageUrl } = req.body;

  if (!title || !month || !schoolType) {
    return res.status(400).json({ message: 'title, month, schoolType은 필수입니다.' });
  }

  const parsedMonth = parseInt(month, 10);
  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return res.status(400).json({ message: 'month는 1~12 사이 숫자여야 합니다.' });
  }

  try {
    const item = await svc.createItem({ title, description, month: parsedMonth, targetGrade, schoolType, challengeId, imageUrl });
    return res.status(201).json(item);
  } catch (err) {
    console.error('[timeRecommend] createItem error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
};

// PUT /api/time-recommendations/admin/:itemId
exports.updateItem = async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(itemId)) return res.status(400).json({ message: '유효하지 않은 itemId' });

  try {
    const item = await svc.updateItem(itemId, req.body);
    if (!item) return res.status(404).json({ message: '항목을 찾을 수 없습니다.' });
    return res.status(200).json(item);
  } catch (err) {
    console.error('[timeRecommend] updateItem error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
};

// DELETE /api/time-recommendations/admin/:itemId
exports.deleteItem = async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(itemId)) return res.status(400).json({ message: '유효하지 않은 itemId' });

  try {
    const deleted = await svc.deleteItem(itemId);
    if (!deleted) return res.status(404).json({ message: '항목을 찾을 수 없습니다.' });
    return res.status(200).json({ message: '삭제 완료' });
  } catch (err) {
    console.error('[timeRecommend] deleteItem error:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
};
