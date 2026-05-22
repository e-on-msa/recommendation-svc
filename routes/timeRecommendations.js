//timeRecommendations.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/timeRecommendationController');

/**
 * @swagger
 * /api/time-recommendations:
 *   get:
 *     summary: 시간·학교급 기반 챌린지 추천
 *     description: 월(month)과 학교급(schoolType)을 기준으로 편집자가 등록한 추천 챌린지를 반환합니다.
 *     tags: [시간 기반 추천]
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 3
 *         description: 추천 월 (1~12)
 *       - in: query
 *         name: schoolType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [elementary, middle]
 *           example: elementary
 *         description: 학교급
 *       - in: query
 *         name: grade
 *         required: false
 *         schema:
 *           type: integer
 *           example: 5
 *         description: 학년 (선택)
 *     responses:
 *       200:
 *         description: 추천 아이템 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimeRecommendationItem'
 *       400:
 *         description: 필수 파라미터 누락
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
router.get('/', controller.getRecommendationsByTime);

module.exports = router;
