'use strict';

module.exports = (sequelize, DataTypes) => {
  const RecommendationItem = sequelize.define('RecommendationItem', {
    item_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    month: {
      type: DataTypes.INTEGER,
    },
    target_grade: {
      type: DataTypes.INTEGER,
    },
    school_type: {
      type: DataTypes.ENUM('elementary', 'middle'),
      allowNull: false,
    },
    dashboard_id: {
      type: DataTypes.INTEGER,
    },
    challenge_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'RecommendationItem',
    freezeTableName: true,
    timestamps: false,
  });

  RecommendationItem.associate = (models) => {
    RecommendationItem.belongsTo(models.RecommendationDashboard, {
      foreignKey: 'dashboard_id',
      as: 'dashboard',
      onDelete: 'CASCADE',
    });
    // challenge_id는 Challenge 서비스 DB의 PK를 참조하는 application-level 참조.
    // MSA 구조상 서비스 간 Sequelize 연관관계는 설정 불가.
  };

  return RecommendationItem;
};
