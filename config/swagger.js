const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recommendation Service API',
      version: '1.0.0',
      description: '추천 서비스 API 문서 (AI 임베딩 추천 / 시간 기반 추천 / 점수 기반 추천)',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 8085}`, description: 'Local' },
    ],
    components: {
      securitySchemes: {
        UserIdHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-user-id',
          description: 'Gateway가 주입하는 로그인 유저 ID',
        },
      },
      schemas: {
        Challenge: {
          type: 'object',
          properties: {
            challenge_id:  { type: 'integer', example: 42 },
            title:         { type: 'string',  example: '코딩 챌린지' },
            description:   { type: 'string',  example: '매일 알고리즘 1문제 풀기' },
            challenge_state: { type: 'string', example: 'ACTIVE' },
            start_date:    { type: 'string', format: 'date', example: '2025-01-01' },
            end_date:      { type: 'string', format: 'date', example: '2025-12-31' },
          },
        },
        ScoredChallenge: {
          allOf: [
            { $ref: '#/components/schemas/Challenge' },
            {
              type: 'object',
              properties: {
                participants: { type: 'integer', example: 120 },
                avg_rating:   { type: 'number',  example: 4.2 },
                match_score:  { type: 'integer', example: 2 },
                total_score:  { type: 'number',  example: 5.8 },
              },
            },
          ],
        },
        TimeRecommendationItem: {
          type: 'object',
          properties: {
            item_id:      { type: 'integer', example: 1 },
            title:        { type: 'string',  example: '봄 추천 챌린지' },
            description:  { type: 'string',  example: '3월 초등학생 추천' },
            month:        { type: 'integer', example: 3 },
            target_grade: { type: 'integer', example: 5 },
            school_type:  { type: 'string',  enum: ['elementary', 'middle'] },
            challenge_id: { type: 'integer', example: 7 },
            image_url:    { type: 'string',  example: 'https://cdn.example.com/img.png' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '오류 메시지' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
