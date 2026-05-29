const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');
const { isLoggedIn } = require('../middleware/auth');

/**
 * @swagger
 * /api/recommendations/recommend:
 *   get:
 *     summary: AI 임베딩 기반 챌린지 추천
 *     description: 유저의 관심사·진로·활동이력을 임베딩하여 유사도 높은 챌린지를 반환합니다.
 *     tags: [AI 추천]
 *     security:
 *       - UserIdHeader: []
 *     responses:
 *       200:
 *         description: 추천 챌린지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Challenge'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', isLoggedIn, recommendController.getRecommendedChallenges);

/**
 * @swagger
 * /api/recommendations/recommend/history:
 *   post:
 *     summary: 활동이력 기반 챌린지 추천
 *     description: 유저의 참여·생성 이력과 커뮤니티 활동을 분석하여 챌린지를 추천합니다.
 *     tags: [AI 추천]
 *     security:
 *       - UserIdHeader: []
 *     responses:
 *       200:
 *         description: 추천 챌린지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Challenge'
 *       401:
 *         description: 로그인 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/history', isLoggedIn, recommendController.recommendByHistory);

module.exports = router;
