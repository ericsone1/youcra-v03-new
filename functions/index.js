const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

/**
 * 시청 기록이 추가/업데이트될 때 자동으로 집계 컬렉션 업데이트
 */
exports.updateVideoStatsOnWatch = functions.firestore
  .document('users/{userId}/watchedVideos/{videoId}')
  .onWrite(async (change, context) => {
    const { userId, videoId } = context.params;
    const newData = change.after.exists ? change.after.data() : null;

    console.log('🔄 [Cloud Functions] 시청 기록 변경 감지:', {
      userId,
      videoId,
      hasNewData: !!newData
    });

    if (!newData) {
      console.log('📝 [Cloud Functions] 시청 기록 삭제됨');
      return;
    }

    try {
      const statsRef = db.collection('videoStats').doc(videoId);
      const statsDoc = await statsRef.get();
      
      if (statsDoc.exists) {
        // 기존 통계 업데이트
        await statsRef.update({
          totalViews: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ [Cloud Functions] 기존 통계 업데이트 완료');
      } else {
        // 새로운 통계 생성
        await statsRef.set({
          videoId,
          totalViews: 1,
          totalLikes: 0,
          uniqueViewers: 1,
          viewers: [userId],
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ [Cloud Functions] 새로운 통계 생성 완료');
      }
    } catch (error) {
      console.error('❌ [Cloud Functions] 통계 업데이트 실패:', error);
    }
  });

/**
 * 주기적으로 통계 데이터 동기화
 */
exports.syncVideoStats = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      console.log('🔄 [Cloud Functions] 주기적 통계 동기화 시작');
      
      // 모든 사용자의 시청 기록을 조회하여 통계 동기화
      const usersSnapshot = await db.collection('users').get();
      const statsMap = {};
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const watchedVideosSnapshot = await db.collection('users', userId, 'watchedVideos').get();
        
        watchedVideosSnapshot.forEach(watchedDoc => {
          const videoId = watchedDoc.id;
          const watchData = watchedDoc.data();
          
          if (!statsMap[videoId]) {
            statsMap[videoId] = {
              totalViews: 0,
              uniqueViewers: new Set(),
              viewers: []
            };
          }
          
          statsMap[videoId].totalViews += watchData.watchCount || 1;
          statsMap[videoId].uniqueViewers.add(userId);
          statsMap[videoId].viewers.push(userId);
        });
      }
      
      // 통계 데이터를 Firestore에 저장
      const batch = db.batch();
      Object.entries(statsMap).forEach(([videoId, stats]) => {
        const statsRef = db.collection('videoStats').doc(videoId);
        batch.set(statsRef, {
          videoId,
          totalViews: stats.totalViews,
          totalLikes: 0,
          uniqueViewers: stats.uniqueViewers.size,
          viewers: Array.from(stats.uniqueViewers),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      
      await batch.commit();
      console.log('✅ [Cloud Functions] 주기적 통계 동기화 완료');
    } catch (error) {
      console.error('❌ [Cloud Functions] 주기적 통계 동기화 실패:', error);
    }
  }); 