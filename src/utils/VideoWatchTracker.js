class VideoWatchTracker {
  constructor(video, onComplete, showToast = null) {
    this.video = video;
    this.onComplete = onComplete; // 시청 완료 콜백
    this.showToast = showToast; // Toast 표시 함수
    this.startTime = Date.now();
    this.totalWatchTime = 0;
    this.lastActiveTime = Date.now();
    this.isWatching = false;

    this.intervals = [];
    this.eventListeners = [];
    this.isFinished = false;
    
    console.log(`🏗️ VideoWatchTracker 생성됨:`, {
      title: this.video.title,
      videoId: this.video.videoId,
      duration: this.video.duration
    });
  }
  
  startTracking() {
    if (this.isFinished) return;
    
    // YouTube 새창은 외부에서 열어주므로 여기서는 추적만 시작
    this.isWatching = true;
    this.lastActiveTime = Date.now();
    
    console.log(`🎬 시청 추적 시작: ${this.video.title}`);
    console.log(`📊 영상 길이: ${this.video.duration}초`);
    console.log(`🎯 목표: ${Math.round(this.video.duration * 0.7)}초 (70%) 이상 시청`);
    console.log(`💡 YouTube 탭으로 이동하면 자동으로 추적이 시작됩니다`);
    
    // 초기 상태 즉시 표시
    setTimeout(() => {
      console.log(`📊 [${this.video.title}] 초기 상태 - 추적 대기 중`);
    }, 100);
    
    // 1. 기본 타이머 (1초마다 체크)
    const basicTimer = setInterval(() => {
      if (this.isFinished) {
        clearInterval(basicTimer);
        return;
      }
      
      if (this.isWatching) {
        // 실제로 YouTube를 보고 있다고 추정되는 시간만 누적
        this.totalWatchTime += 1000;
        
        // 10초마다 로그 출력 + 현재 상태 표시
        const currentSeconds = Math.round(this.totalWatchTime / 1000);
        if (currentSeconds % 10 === 0) {
          const progress = Math.round((currentSeconds / (this.video.duration || 300)) * 100);
          console.log(`⏱️ [${this.video.title}] 시청시간: ${currentSeconds}초 (${progress}%)`);
        }
      }
    }, 1000);
    this.intervals.push(basicTimer);
    
    // 2. Focus/Blur 이벤트 설정
    const handleFocus = () => this.onWindowFocus();
    const handleBlur = () => this.onWindowBlur();
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    this.eventListeners.push(
      () => window.removeEventListener('focus', handleFocus),
      () => window.removeEventListener('blur', handleBlur)
    );
    
    // 3. 스마트 종료 조건들
    // a) 최대 추적 시간 제한 (영상 길이의 1.3배)
    const maxTrackingTime = (this.video.duration || 300) * 1.3 * 1000;
    const maxTimer = setTimeout(() => {
      console.log('⏰ 최대 추적 시간 초과 - 자동 종료');
      this.finishTracking();
    }, maxTrackingTime);
    
    // b) 유크라 창이 활성화된 상태로 5분 이상 유지되면 시청 종료로 간주
    let inactiveTimer = null;
    const resetInactiveTimer = () => {
      if (inactiveTimer) clearTimeout(inactiveTimer);
      if (!this.isWatching) { // 유크라 창이 활성화된 상태일 때만
        inactiveTimer = setTimeout(() => {
          if (!this.isWatching && !this.isFinished) {
            console.log('📱 유크라 창에서 5분 이상 머물렀음 - 시청 종료로 간주');
            this.finishTracking();
          }
        }, 5 * 60 * 1000); // 5분
      }
    };
    
    // 초기 비활성 타이머 설정
    resetInactiveTimer();
    
    // Focus/Blur 이벤트에 비활성 타이머 리셋 로직 추가
    const originalHandleFocus = this.onWindowFocus.bind(this);
    const originalHandleBlur = this.onWindowBlur.bind(this);
    
    this.onWindowFocus = () => {
      originalHandleFocus();
      resetInactiveTimer();
    };
    
    this.onWindowBlur = () => {
      originalHandleBlur();
      if (inactiveTimer) clearTimeout(inactiveTimer);
    };
    
    // setTimeout도 정리 대상에 추가
    this.intervals.push({ clear: () => clearTimeout(maxTimer) });
  }
  
  onWindowFocus() {
    if (this.isFinished) return;
    
    if (this.isWatching) {
      // 정확한 시청 시간 계산 (Focus/Blur 방식)
      const precisWatchTime = Date.now() - this.lastActiveTime;
      
      // 기본 타이머와 정확한 시간 중 더 큰 값 사용 (중복 계산 방지)
      if (precisWatchTime > 1000) {
        this.totalWatchTime = Math.max(this.totalWatchTime, this.totalWatchTime - 1000 + precisWatchTime);
      }
      
      this.isWatching = false;
      
      const currentSeconds = Math.round(this.totalWatchTime / 1000);
      const progress = Math.round((currentSeconds / (this.video.duration || 300)) * 100);
      console.log(`👁️ [${this.video.title}] 유크라로 돌아옴 - 시청시간: ${currentSeconds}초 (${progress}%)`);
      
      // 실시간으로 시청률 체크
      this.checkProgress();
    }
  }
  
  onWindowBlur() {
    if (this.isFinished) return;
    
    // 유크라 창에서 다른 곳으로 이동 (YouTube로 추정)
    this.lastActiveTime = Date.now();
    this.isWatching = true;
    console.log(`🎥 [${this.video.title}] YouTube로 이동 감지 - 추적 시작`);
  }
  
  checkProgress() {
    const videoDuration = this.video.duration || 300;
    const watchPercentage = (this.totalWatchTime / 1000) / videoDuration;
    const minWatchPercentage = 0.7; // 70% 시청 필요
    
    console.log(`📈 현재 시청률: ${(watchPercentage * 100).toFixed(1)}%`);
    
    if (watchPercentage >= minWatchPercentage && !this.isFinished) {
      console.log('🎉 시청 조건 달성!');
      this.finishTracking();
    }
  }
  
  finishTracking() {
    if (this.isFinished) return;
    this.isFinished = true;
    
    // 마지막 시청 시간 추가
    if (this.isWatching && this.lastActiveTime) {
      const finalWatchTime = Date.now() - this.lastActiveTime;
      this.totalWatchTime += finalWatchTime;
    }
    
    // 모든 타이머와 이벤트 리스너 정리
    this.intervals.forEach(interval => {
      if (interval.clear) {
        interval.clear();
      } else {
        clearInterval(interval);
      }
    });
    this.eventListeners.forEach(cleanup => cleanup());
    
    // 최종 결과 계산
    const videoDuration = this.video.duration || 300;
    const watchTimeSeconds = Math.round(this.totalWatchTime / 1000);
    const watchPercentage = watchTimeSeconds / videoDuration;
    
    console.log(`📊 === 시청 완료 분석 ===`);
    console.log(`📹 영상: ${this.video.title}`);
    console.log(`⏱️ 총 시청시간: ${watchTimeSeconds}초`);
    console.log(`🎬 영상 길이: ${videoDuration}초`);
    console.log(`📈 시청률: ${(watchPercentage * 100).toFixed(1)}%`);
    console.log(`========================`);
    
    this.processResult(watchTimeSeconds, watchPercentage);
  }
  
  processResult(watchTimeSeconds, watchPercentage) {
    const minWatchPercentage = 0.7; // 70% 이상 시청 필요
    const minWatchTime = 30; // 최소 30초는 봐야 함
    
    const result = {
      video: this.video,
      watchTimeSeconds,
      watchPercentage: Math.round(watchPercentage * 100),
      videoDuration: this.video.duration || 300,
      completed: watchPercentage >= minWatchPercentage && watchTimeSeconds >= minWatchTime
    };
    
    if (result.completed) {
      console.log('✅ 토큰 지급 조건 만족!');
      this.awardToken(result);
    } else {
      console.log('❌ 토큰 지급 조건 미달');
      this.showIncompletionMessage(result);
    }
    
    // 상위 컴포넌트에 결과 전달
    if (this.onComplete) {
      this.onComplete(result);
    }
  }
  
  awardToken(result) {
    console.log('🎁 토큰 지급!');
    
    // 토큰 지급 알림은 상위 컴포넌트에서 처리하므로 여기서는 로그만
  }
  
  showIncompletionMessage(result) {
    // 시청 미완료 메시지도 상위 컴포넌트에서 처리하므로 여기서는 로그만
    const requiredTime = Math.round((this.video.duration || 300) * 0.7);
    console.log(`시청 미완료: ${result.watchTimeSeconds}초 / ${requiredTime}초 필요`);
  }
  
  showToastMessage(message, type) {
    if (this.showToast) {
      // 외부에서 전달받은 Toast 함수 사용
      this.showToast(message, type, 5000);
    } else {
      // Fallback: 간단한 console 로그
      const emoji = type === 'success' ? '🎉' : '⚠️';
      console.log(`${emoji} ${message}`);
    }
  }
  
  // 수동으로 추적 중단
  stop() {
    if (!this.isFinished) {
      console.log('🛑 시청 추적을 수동으로 중단합니다');
      this.finishTracking();
    }
  }
  
  // 현재 상태 반환
  getStatus() {
    return {
      isActive: !this.isFinished,
      isWatching: this.isWatching,
      totalWatchTime: Math.round(this.totalWatchTime / 1000),
      watchPercentage: Math.round((this.totalWatchTime / 1000) / (this.video.duration || 300) * 100)
    };
  }
}

export default VideoWatchTracker; 