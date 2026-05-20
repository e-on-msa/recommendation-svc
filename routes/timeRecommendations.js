//timeRecommendations.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/timeRecommendationController');

router.get('/', controller.getRecommendationsByTime);  // /api/time-recommendations?grade=1&month=3

module.exports = router;
