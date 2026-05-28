const axios = require('axios');

const CHALLENGE_SVC = process.env.CHALLENGE_SERVICE_URL;

// GET /internal/challenges/with-stats
// 응답 예시: [{
//   challenge_id, challenge_title, challenge_description,
//   minimum_age, maximum_age, challenge_state,
//   start_date, end_date, application_deadline,
//   is_recuming, intermediate_participation,
//   participant_count, avg_rating,
//   interest_ids: [1, 2],
//   vision_ids: [3, 4],
// }]
exports.getChallengesWithStats = async () => {
  const { data } = await axios.get(`${CHALLENGE_SVC}/internal/challenges/with-stats`);
  return data;
};
