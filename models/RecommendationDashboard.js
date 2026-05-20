'use strict';

module.exports = (sequelize, DataTypes) => {
  const RecommendationDashboard = sequelize.define('RecommendationDashboard', {
    dashboard_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recommendation_type: {
      type: DataTypes.STRING,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'RecommendationDashboard',
    freezeTableName: true,
    timestamps: false,
  });

  RecommendationDashboard.associate = (models) => {
    RecommendationDashboard.hasMany(models.RecommendationItem, {
      foreignKey: 'dashboard_id',
      as: 'items',
      onDelete: 'CASCADE',
    });
  };

  return RecommendationDashboard;
};
