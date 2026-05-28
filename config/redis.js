const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => console.log('Redis 연결 성공'));
redis.on('error', (err) => console.warn('Redis 연결 에러:', err.message));

module.exports = redis;
