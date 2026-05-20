require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { startConsumer } = require('./messaging/consumer');

const aiRecommendRoutes = require('./routes/aiRecommendRoutes');
const timeRecommendations = require('./routes/timeRecommendations');
const recommendations = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 8085;

app.use(helmet());
app.use(cors({ origin: process.env.GATEWAY_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/recommend', aiRecommendRoutes);
app.use('/time-recommendations', timeRecommendations);
app.use('/recommendations', recommendations);

app.listen(PORT, async () => {
  console.log(`Recommendation Service running on :${PORT}`);
  await startConsumer();
});
