const axios = require('axios');

const USER_SVC = process.env.USER_SERVICE_URL;

// GET /internal/preferences/user/:userId
// 응답 예시: { age, interests: [{ interest_id }], visions: [{ vision_id }] }
exports.getPreferences = async (userId) => {
  const { data } = await axios.get(`${USER_SVC}/internal/preferences/user/${userId}`);
  return data;
};

// GET /internal/users/ids
// 응답 예시: [1, 2, 3, ...]
exports.getAllUserIds = async () => {
  const { data } = await axios.get(`${USER_SVC}/internal/users/ids`);
  return data;
};
