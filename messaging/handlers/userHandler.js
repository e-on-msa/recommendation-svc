const recommendService = require('../../services/recommendService');

// user.interests.updated
// payload: { userId }
exports.onInterestsUpdated = async ({ userId }) => {
  console.log(`[userHandler] interests updated → userId: ${userId}`);
  await recommendService.recalculateForUser(userId);
};

// user.vision.updated
// payload: { userId }
exports.onVisionUpdated = async ({ userId }) => {
  console.log(`[userHandler] vision updated → userId: ${userId}`);
  await recommendService.recalculateForUser(userId);
};
