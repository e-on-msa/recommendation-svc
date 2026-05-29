const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/timeRecommendationController');
const { isLoggedIn } = require('../middleware/auth');

/**
 * @swagger
 * /api/recommendations/time:
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
 *         description: 학년 (선택 — 없으면 전체 학년 반환)
 *     responses:
 *       200:
 *         description: 추천 아이템 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimeRecommendationItem'
 *       400:
 *         description: 필수 파라미터 누락 또는 잘못된 값
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
router.get('/', ctrl.getRecommendationsByTime);

/**
 * @swagger
 * /api/time-recommendations/admin:
 *   post:
 *     summary: 시기별 추천 항목 추가 (관리자)
 *     description: time_based 대시보드에 추천 항목을 추가합니다. 대시보드가 없으면 자동 생성됩니다.
 *     tags: [시간 기반 추천 - 관리자]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, month, schoolType]
 *             properties:
 *               title:
 *                 type: string
 *                 example: 봄 코딩 챌린지
 *               description:
 *                 type: string
 *                 example: 3월 초등학생을 위한 코딩 챌린지
 *               month:
 *                 type: integer
 *                 example: 3
 *               targetGrade:
 *                 type: integer
 *                 example: 5
 *               schoolType:
 *                 type: string
 *                 enum: [elementary, middle]
 *                 example: elementary
 *               challengeId:
 *                 type: integer
 *                 example: 42
 *               imageUrl:
 *                 type: string
 *                 example: https://cdn.example.com/img.png
 *     responses:
 *       201:
 *         description: 생성된 추천 항목
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeRecommendationItem'
 *       400:
 *         description: 필수 파라미터 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/admin', isLoggedIn, ctrl.createItem);

/**
 * @swagger
 * /api/time-recommendations/admin/{itemId}:
 *   put:
 *     summary: 시기별 추천 항목 수정 (관리자)
 *     tags: [시간 기반 추천 - 관리자]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               month:
 *                 type: integer
 *               targetGrade:
 *                 type: integer
 *               schoolType:
 *                 type: string
 *                 enum: [elementary, middle]
 *               challengeId:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정된 항목
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimeRecommendationItem'
 *       404:
 *         description: 항목 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: 시기별 추천 항목 삭제 (관리자)
 *     tags: [시간 기반 추천 - 관리자]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 삭제 완료
 *       404:
 *         description: 항목 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/admin/:itemId', isLoggedIn, ctrl.updateItem);
router.delete('/admin/:itemId', isLoggedIn, ctrl.deleteItem);

module.exports = router;
