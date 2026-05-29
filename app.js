require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const aiRecommendRoutes = require('./routes/aiRecommendRoutes');
const timeRecommendations = require('./routes/timeRecommendations');
const recommendations = require('./routes/recommendations');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.GATEWAY_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// /api/recommendations/recommend 가 /:userId 보다 먼저 등록되어야 함
// /api/recommendations/recommend, /api/recommendations/time 가 /:userId 보다 먼저 등록되어야 함
app.use('/api/recommendations/recommend', aiRecommendRoutes);
app.use('/api/recommendations/time', timeRecommendations);
app.use('/api/recommendations', recommendations);

module.exports = app;
