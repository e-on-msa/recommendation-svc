const { sequelize } = require('../database/db');
const RecommendationDashboard = require('./RecommendationDashboard')(sequelize);
const RecommendationItem = require('./RecommendationItem')(sequelize);

RecommendationDashboard.hasMany(RecommendationItem, {
  foreignKey: 'dashboard_id',
  as: 'items',
  onDelete: 'CASCADE',
});
RecommendationItem.belongsTo(RecommendationDashboard, {
  foreignKey: 'dashboard_id',
  as: 'dashboard',
  onDelete: 'CASCADE',
});

module.exports = { sequelize, RecommendationDashboard, RecommendationItem };
