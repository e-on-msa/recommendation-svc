const recommendService = require('../../services/recommendService');

// challenge.created
// payload: { challengeId, status }
// status가 APPROVED(지자체)일 때만 후보 편입, PENDING이면 무시
exports.onCreated = async ({ challengeId, status }) => {
  console.log(`[challengeHandler] created → challengeId: ${challengeId}, status: ${status}`);
  if (status === 'APPROVED') {
    await recommendService.addChallengeCandidate(challengeId);
  }
};

// challenge.approved
// payload: { challengeId }
exports.onApproved = async ({ challengeId }) => {
  console.log(`[challengeHandler] approved → challengeId: ${challengeId}`);
  await recommendService.addChallengeCandidate(challengeId);
};

// challenge.updated
// payload: { challengeId }
exports.onUpdated = async ({ challengeId }) => {
  console.log(`[challengeHandler] updated → challengeId: ${challengeId}`);
  await recommendService.updateChallengeCandidate(challengeId);
};

// challenge.state.changed
// payload: { challengeId, state }
// CLOSED / CANCELLED → 후보에서 제외
exports.onStateChanged = async ({ challengeId, state }) => {
  console.log(`[challengeHandler] state changed → challengeId: ${challengeId}, state: ${state}`);
  if (state === 'CLOSED' || state === 'CANCELLED') {
    await recommendService.removeChallengeCandidate(challengeId);
  } else if (state === 'ACTIVE') {
    await recommendService.addChallengeCandidate(challengeId);
  }
};

// challenge.deleted
// payload: { challengeId }
exports.onDeleted = async ({ challengeId }) => {
  console.log(`[challengeHandler] deleted → challengeId: ${challengeId}`);
  await recommendService.removeChallengeCandidate(challengeId);
};
