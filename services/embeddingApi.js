const axios = require('axios');

module.exports = async function callEmbeddingRecommendation(userText, challengeTexts) {
  try {
    const base = process.env.AI_SERVICE_URL || `http://${process.env.HOST}:5000`;
    const response = await axios.post(
      `${base}/recommend`,
      {
        user_text: userText,
        challenges: challengeTexts,
      },
      { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
    );

    return response.data.recommended_ids || [];
  } catch (error) {
    console.error('AI 서비스 오류:', error.message);
    return [];
  }
};
