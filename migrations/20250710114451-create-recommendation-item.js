'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RecommendationItem', {
      item_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      target_grade: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      school_type: {
        type: Sequelize.ENUM('elementary', 'middle'),
        allowNull: false,
      },
      dashboard_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'RecommendationDashboard',
          key: 'dashboard_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // challenge_id는 Challenge 서비스 DB의 PK를 참조하지만,
      // MSA 구조에서 서비스 간 DB FK는 불가 → application-level 참조로만 관리
      challenge_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RecommendationItem');
  },
};
