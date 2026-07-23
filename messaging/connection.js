const amqp = require('amqplib');

let channel = null;

async function connect(onConnected) {        // ① 파라미터 추가
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    console.log('RabbitMQ 연결 성공');

    if (onConnected) await onConnected(channel);   // ② 연결되면 콜백 실행

    connection.on('error', (err) => {
      console.error('[RabbitMQ] 연결 에러:', err.message);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ 연결 끊김. 5초 후 재연결 시도...');
      channel = null;
      setTimeout(() => connect(onConnected), 5000);   // ③ 콜백 넘기며 재연결
    });

    return channel;
  } catch (err) {
    console.warn('RabbitMQ 연결 실패:', err.message);
    setTimeout(() => connect(onConnected), 5000);     // ④ 여기도 콜백 유지
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
