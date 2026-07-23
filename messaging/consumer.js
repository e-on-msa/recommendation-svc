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
  { routingKey: 'challenge.state.updated', handler: challengeHandler.onStateUpdated },
  { routingKey: 'challenge.deleted',       handler: challengeHandler.onDeleted },

  // Community Service 이벤트
  { routingKey: 'community.post.created',  handler: communityHandler.onPostCreated },
];

/**
 * 큐 선언 · 바인딩 · consume 등록만 담당하는 함수
 * connect()에 콜백으로 전달되어, 연결이 성공할 때마다 실행된다.
 */
async function setupQueues(channel) {
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  for (const { routingKey, handler } of SUBSCRIPTIONS) {
    const queueName = `recommendation.${routingKey}`;
    const { queue } = await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queue, EXCHANGE, routingKey);

    channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event.payload ?? event);
        channel.ack(msg);
      } catch (err) {
        console.error(`[RabbitMQ] error handling ${routingKey}:`, err.message);
        channel.nack(msg, false, false);
      }
    });

    console.log(`[RabbitMQ] subscribed: ${routingKey}`);
  }

  console.log('[RabbitMQ] 큐 등록 완료');
}

/**
 * 연결을 시도하고, 연결 성공 시마다 setupQueues가 실행되도록 콜백으로 전달한다.
 * 최초 기동 시 RabbitMQ가 아직 뜨지 않았거나 운영 중 연결이 끊겨도
 * 재연결이 성공하는 시점에 큐가 다시 등록된다.
 */
async function startConsumer() {
  await connect(setupQueues);
}

module.exports = { startConsumer, setupQueues };
