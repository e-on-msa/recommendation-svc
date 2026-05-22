'use strict';

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RecommendationCache', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    challenge_ids: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'RecommendationCache',
    freezeTableName: true,
    timestamps: false,
  });
};
