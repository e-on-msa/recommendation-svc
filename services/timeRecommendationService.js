const { sequelize, Sequelize } = require('../database/db');

const db = require('../models');
//const RecommendationItemModel = db.RecommendationItem;
const RecommendationDashboardModel = db.RecommendationDashboard;

//const RecommendationItem = RecommendationItemModel(sequelize, Sequelize.DataTypes);
const RecommendationItem = db.RecommendationItem;
//const RecommendationDashboard = RecommendationDashboardModel(sequelize, Sequelize.DataTypes);
const RecommendationDashboard = db.RecommendationDashboard;

// 연관관계 정의
RecommendationItem.belongsTo(RecommendationDashboard, {
  foreignKey: 'dashboard_id',
  targetKey: 'dashboard_id'
});

// grade가 선택적(optional)이므로 조건에 따라 where 절 동적으로 구성
const getByGradeAndMonth = async (grade, month, schoolType) => {
  const whereClause = {
    month,
    school_type: schoolType,
  };

  if (grade !== undefined && grade !== null) {
    whereClause.target_grade = grade;
  }

  return RecommendationItem.findAll({
    where: whereClause,
    include: [
      {
        model: RecommendationDashboard,
        where: { recommendation_type: 'time_based' },
      },
    ],
    attributes: ['item_id', 'title', 'description', 'month', 'target_grade'],
  });
};

module.exports = {
  getByGradeAndMonth,
};