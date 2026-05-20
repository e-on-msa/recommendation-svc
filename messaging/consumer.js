const { connect } = require('./connection');
const userHandler = require('./handlers/userHandler');
const challengeHandler = require('./handlers/challengeHandler');
const communityHandler = require('./handlers/communityHandler');

const EXCHANGE = 'eon.events';

// 구독할 이벤트 목록
const SUBSCRIPTIONS = [
  // User Service 이벤트
  { routingKey: 'user.interests.updated', handler: userHandler.onInterestsUpdated },
  { routingKey: 'user.vision.updated',    handler: userHandler.onVisionUpdated },

  // Challenge Service 이벤트
  { routingKey: 'challenge.created',       handler: challengeHandler.onCreated },
  { routingKey: 'challenge.approved',      handler: challengeHandler.onApproved },
  { routingKey: 'challenge.updated',       handler: challengeHandler.onUpdated },
  { routingKey: 'challenge.state.changed', handler: challengeHandler.onStateChanged },
  { routingKey: 'challenge.deleted',       handler: challengeHandler.onDeleted },

  // Community Service 이벤트
  { routingKey: 'community.post.created',  handler: communityHandler.onPostCreated },
];

async function startConsumer() {
  const channel = await connect();
  if (!channel) return;

  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  for (const { routingKey, handler } of SUBSCRIPTIONS) {
    const queueName = `recommendation.${routingKey}`;
    const { queue } = await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queue, EXCHANGE, routingKey);

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        channel.ack(msg);
      } catch (err) {
        console.error(`[RabbitMQ] error handling ${routingKey}:`, err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`[RabbitMQ] subscribed: ${routingKey}`);
  }
}

module.exports = { startConsumer };
