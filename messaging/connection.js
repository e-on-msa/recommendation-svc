const amqp = require('amqplib');

let channel = null;

async function connect() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    connection.on('error', (err) => {
      console.error('[RabbitMQ] connection error:', err.message);
      setTimeout(connect, 5000);
    });

    connection.on('close', () => {
      console.warn('[RabbitMQ] connection closed. reconnecting...');
      setTimeout(connect, 5000);
    });

    console.log('[RabbitMQ] connected');
    return channel;
  } catch (err) {
    console.error('[RabbitMQ] failed to connect:', err.message);
    setTimeout(connect, 5000);
  }
}

function getChannel() {
  return channel;
}

module.exports = { connect, getChannel };
