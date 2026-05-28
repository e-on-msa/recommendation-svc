const userClient = require('../clients/userClient');
const challengeClient = require('../clients/challengeClient');

function isActive(c) {
  if (c.challenge_state !== 'ACTIVE') return false;
  const now = new Date();
  if (c.application_deadline && new Date(c.application_deadline) < now) return false;
  if (c.end_date && new Date(c.end_date) < now) return false;
  return true;
}

function inAgeRange(c, age) {
  if (c.minimum_age != null && age < c.minimum_age) return false;
  if (c.maximum_age != null && age > c.maximum_age) return false;
  return true;
}

function calcScore(c, interestIds, visionIds) {
  const matchInterest = (c.interest_ids || []).some(id => interestIds.includes(id)) ? 1 : 0;
  const matchVision   = (c.vision_ids   || []).some(id => visionIds.includes(id))   ? 1 : 0;
  const matchScore    = matchInterest + matchVision;
  const participants  = c.participant_count || 0;
  const avgRating     = c.avg_rating ?? 3.0;
  const totalScore    = matchScore
    + Math.max(Math.log(participants + 1) * 0.5, 0.5)
    + avgRating * 0.3;
  return { matchScore, totalScore };
}

function sortByScore(items) {
  return items.sort((a, b) =>
    b.totalScore - a.totalScore || new Date(a.start_date) - new Date(b.start_date)
  );
}

async function recommend({ userId, limit, offset }) {
  const [preferences, challenges] = await Promise.all([
    userClient.getPreferences(userId),
    challengeClient.getChallengesWithStats(),
  ]);

  const { age, interests = [], visions = [] } = preferences;
  const interestIds = interests.map(i => i.interest_id ?? i);
  const visionIds   = visions.map(v => v.vision_id ?? v);

  const active = challenges.filter(isActive);
  const scored = active.map(c => ({ ...c, ...calcScore(c, interestIds, visionIds) }));

  // 1단계: 매칭 + 나이 + 날짜
  let items = sortByScore(scored.filter(c => c.matchScore > 0 && inAgeRange(c, age)));
  let stage = 'strict(match+age+date)';

  // 2단계: 매칭 + 날짜 (나이 완화)
  if (items.length === 0) {
    items = sortByScore(scored.filter(c => c.matchScore > 0));
    stage = 'fallback(match+date)';
  }

  // 3단계: 날짜만 (인기순)
  if (items.length === 0) {
    items = sortByScore([...scored]);
    stage = 'fallback(date-only)';
  }

  return {
    items: items.slice(offset, offset + limit),
    stage,
    userAge: age,
  };
}

module.exports = { recommend };
