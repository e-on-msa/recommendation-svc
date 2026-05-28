도require('dotenv').config();
const amqp = require('amqplib');

const EXCHANGE = 'eon.events';

const TEST_EVENTS = [
  { routingKey: 'user.interests.updated',  payload: { userId: 1 } },
  { routingKey: 'challenge.created',       payload: { challengeId: 100, status: 'APPROVED' } },
  { routingKey: 'community.post.created',  payload: { userId: 1, postId: 99 } },
];

async function publish() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const ch   = await conn.createChannel();

  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

  for (const { routingKey, payload } of TEST_EVENTS) {
    ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)));
    console.log(`[TEST] published → ${routingKey}`, payload);
  }

  await ch.close();
  await conn.close();
}

publish().catch(console.error);
