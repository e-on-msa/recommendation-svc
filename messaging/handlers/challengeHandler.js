const recommendService = require('../../services/recommendService');

// challenge.created
// payload: { challenge_id, status }
// status가 APPROVED(지자체)일 때만 후보 편입, PENDING이면 무시
exports.onCreated = async ({ challenge_id, status }) => {
  console.log(`[challengeHandler] created → challengeId: ${challenge_id}, status: ${status}`);
  if (status === 'APPROVED') {
    await recommendService.addChallengeCandidate(challenge_id);
  }
};

// challenge.approved
// payload: { challenge_id }
exports.onApproved = async ({ challenge_id }) => {
  console.log(`[challengeHandler] approved → challengeId: ${challenge_id}`);
  await recommendService.addChallengeCandidate(challenge_id);
};

// challenge.updated
// payload: { challenge_id }
exports.onUpdated = async ({ challenge_id }) => {
  console.log(`[challengeHandler] updated → challengeId: ${challenge_id}`);
  await recommendService.updateChallengeCandidate(challenge_id);
};

// challenge.state.updated
// payload: { challenge_id, state }
// CLOSED / CANCELLED → 후보에서 제외
exports.onStateUpdated = async ({ challenge_id, state }) => {
  console.log(`[challengeHandler] state changed → challengeId: ${challenge_id}, current_state: ${current_state}`);
  if (state === 'CLOSED' || state === 'CANCELLED') {
    await recommendService.removeChallengeCandidate(challenge_id);
  } else if (state === 'ACTIVE') {
    await recommendService.addChallengeCandidate(challenge_id);
  }
};

// challenge.deleted
// payload: { challenge_id }
exports.onDeleted = async ({ challenge_id }) => {
  console.log(`[challengeHandler] deleted → challengeId: ${challenge_id}`);
  await recommendService.removeChallengeCandidate(challenge_id);
};
