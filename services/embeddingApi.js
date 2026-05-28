const axios = require('axios');

module.exports = async function callEmbeddingRecommendation(userText, challengeTexts) {
  try {
    const base = process.env.AI_SERVICE_URL;
    const response = await axios.post(
      `${base}/internal/recommend`,
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
