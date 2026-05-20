const { sequelize, Sequelize } = require('../database/db');
const DataTypes = Sequelize.DataTypes;

const RecommendationDashboard = require('./RecommendationDashboard')(sequelize, DataTypes);
const RecommendationItem = require('./RecommendationItem')(sequelize, DataTypes);

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
