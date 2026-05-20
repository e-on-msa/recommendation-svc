const recommendService = require('../../services/recommendService');

// community.post.created
// payload: { userId, postId }
exports.onPostCreated = async ({ userId, postId }) => {
  console.log(`[communityHandler] post created → userId: ${userId}, postId: ${postId}`);
  await recommendService.recalculateForUser(userId);
};
