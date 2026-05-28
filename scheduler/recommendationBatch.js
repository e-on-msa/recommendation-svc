const cron = require('node-cron');
const userClient = require('../clients/userClient');
const recommendService = require('../services/recommendService');

// 매일 새벽 3시 전체 유저 추천 재계산
function startBatchScheduler() {
  cron.schedule('0 3 * * *', async () => {
    console.log('[batch] 추천 재계산 시작:', new Date().toISOString());

    let userIds;
    try {
      userIds = await userClient.getAllUserIds();
    } catch (err) {
      console.error('[batch] 유저 목록 조회 실패:', err.message);
      return;
    }

    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        await recommendService.recalculateForUser(userId);
        success++;
      } catch (err) {
        console.error(`[batch] userId ${userId} 재계산 실패:`, err.message);
        failed++;
      }
    }

    console.log(`[batch] 추천 재계산 완료 — 성공: ${success}, 실패: ${failed}`);
  }, { timezone: 'Asia/Seoul' });

  console.log('[batch] 추천 재계산 스케줄러 등록 완료 (0 3 * * *, Asia/Seoul)');
}

module.exports = { startBatchScheduler };
