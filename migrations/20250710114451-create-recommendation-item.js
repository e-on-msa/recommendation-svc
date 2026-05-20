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
      challenge_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'Challenge',
          key: 'challenge_id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
