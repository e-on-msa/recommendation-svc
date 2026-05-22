require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { startConsumer } = require('./messaging/consumer');

const PORT = process.env.PORT || 8085;

app.listen(PORT, async () => {
  console.log(`Recommendation Service running on :${PORT}`);
  await sequelize.sync({ alter: true });
  console.log('테이블 동기화 완료');
  await startConsumer();
});
