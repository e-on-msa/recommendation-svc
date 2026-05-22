const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');
const { isLoggedIn } = require('../middleware/auth');

// GET /recommend
router.get('/', isLoggedIn, recommendController.getRecommendedChallenges);

// POST /recommend/history
router.post('/history', isLoggedIn, recommendController.recommendByHistory);

module.exports = router;
