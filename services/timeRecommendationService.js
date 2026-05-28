const { RecommendationItem, RecommendationDashboard } = require('../models');

// 월·학교급·학년 기반 시기별 추천 조회
const getByGradeAndMonth = async (grade, month, schoolType) => {
  const whereClause = { month, school_type: schoolType };
  if (grade !== undefined && grade !== null) {
    whereClause.target_grade = grade;
  }

  const items = await RecommendationItem.findAll({
    where: whereClause,
    include: [
      {
        model: RecommendationDashboard,
        as: 'dashboard',
        where: { recommendation_type: 'time_based' },
        attributes: [],       // 대시보드 필드는 응답에 노출하지 않음
        required: true,       // INNER JOIN — time_based 항목만 반환
      },
    ],
    attributes: ['item_id', 'title', 'description', 'month', 'target_grade', 'school_type', 'challenge_id', 'image_url'],
    order: [['target_grade', 'ASC'], ['item_id', 'ASC']],
  });

  return items;
};

// 시기별 추천 항목 단건 추가 (관리자용)
const createItem = async ({ title, description, month, targetGrade, schoolType, challengeId, imageUrl }) => {
  // time_based 대시보드가 없으면 자동 생성
  const [dashboard] = await RecommendationDashboard.findOrCreate({
    where: { recommendation_type: 'time_based' },
    defaults: { recommendation_type: 'time_based' },
  });

  const item = await RecommendationItem.create({
    title,
    description,
    month,
    target_grade: targetGrade ?? null,
    school_type: schoolType,
    challenge_id: challengeId ?? null,
    image_url: imageUrl ?? null,
    dashboard_id: dashboard.dashboard_id,
  });

  return item;
};

// 시기별 추천 항목 수정 (관리자용)
const updateItem = async (itemId, fields) => {
  const item = await RecommendationItem.findByPk(itemId);
  if (!item) return null;

  await item.update({
    ...(fields.title       !== undefined && { title: fields.title }),
    ...(fields.description !== undefined && { description: fields.description }),
    ...(fields.month       !== undefined && { month: fields.month }),
    ...(fields.targetGrade !== undefined && { target_grade: fields.targetGrade }),
    ...(fields.schoolType  !== undefined && { school_type: fields.schoolType }),
    ...(fields.challengeId !== undefined && { challenge_id: fields.challengeId }),
    ...(fields.imageUrl    !== undefined && { image_url: fields.imageUrl }),
  });

  return item;
};

// 시기별 추천 항목 삭제 (관리자용)
const deleteItem = async (itemId) => {
  const deleted = await RecommendationItem.destroy({ where: { item_id: itemId } });
  return deleted > 0;
};

module.exports = { getByGradeAndMonth, createItem, updateItem, deleteItem };
