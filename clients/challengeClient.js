const axios = require('axios');

const CHALLENGE_SVC = process.env.CHALLENGE_SERVICE_URL;

// GET /internal/challenges/active-with-categories
exports.getChallengesWithStats = async () => {
  const { data } = await axios.get(`${CHALLENGE_SVC}/internal/challenges/active-with-categories`);
  return data.challenges || [];
};
