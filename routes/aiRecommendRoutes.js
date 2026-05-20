const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');
const { isLoggedIn } = require('../middleware/auth'); // 로그인 확인용

router.get('/recommend', isLoggedIn, recommendController.getRecommendedChallenges);
router.post('/recommend/history', isLoggedIn, recommendController.getRecommendedChallenges);
module.exports = router;
