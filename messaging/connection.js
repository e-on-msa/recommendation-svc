const amqp = require('amqplib');

let channel = null;

async function connect(onConnected) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    console.log('RabbitMQ 연결 성공');

    // 연결이 성공할 때마다 큐 등록 실행
    if (onConnected) {
      await onConnected(channel);
    }

    connection.on('error', (err) => {
      console.error('[RabbitMQ] 연결 에러:', err.message);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ 연결 끊김. 5초 후 재연결 시도...');
      channel = null;
      setTimeout(() => connect(onConnected), 5000);
    });

    return channel;
  } catch (err) {
    console.warn('RabbitMQ 연결 실패. 5초 후 재시도:', err.message);
    setTimeout(() => connect(onConnected), 5000);
  }
}

function getChannel() {
  return channel;
}

async function publish(exchange, routingKey, payload) {
  if (!channel) {
    console.warn(`[RabbitMQ] channel 없음. 이벤트 발행 스킵: ${routingKey}`);
    return;
  }

  try {
    await channel.assertExchange(exchange, 'topic', { durable: true });
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );
    console.log(`[RabbitMQ] 이벤트 발행: ${routingKey}`, payload);
  } catch (err) {
    console.error(`[RabbitMQ] 이벤트 발행 실패: ${routingKey}`, err.message);
  }
}

module.exports = { connect, getChannel, publish };
