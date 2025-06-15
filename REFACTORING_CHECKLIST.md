# 🔍 Home.js 리팩토링 체크리스트

## 📋 코드 누락 방지 체크리스트

### ✅ 백업 완료
- [x] 원본 브랜치 백업: `main`
- [x] 리팩토링 브랜치 생성: `refactor/home-modularization`
- [x] 원본 파일 백업: `Home_ORIGINAL_BACKUP.js`

---

## 📊 원본 파일 분석 (Home.js - 972줄)

### 🔧 **상수 & 설정**
- [ ] `API_KEY` - YouTube API 키
- [ ] `CATEGORY_KEYWORDS` - 카테고리별 키워드 매핑 (40줄)

### 🎣 **커스텀 훅 & 상태**
- [ ] `useAuth()` - 인증 상태
- [ ] `useState` 상태들 (20개+):
  - [ ] `videos, setVideos`
  - [ ] `loading, setLoading`
  - [ ] `error, setError`
  - [ ] `searchQuery, setSearchQuery`
  - [ ] `selectedVideoId, setSelectedVideoId`
  - [ ] `watchSeconds, setWatchSeconds`
  - [ ] `isPlaying, setIsPlaying`
  - [ ] `watchTimer, setWatchTimer`
  - [ ] `liked, setLiked`
  - [ ] `likeCount, setLikeCount`
  - [ ] `visibleCount, setVisibleCount`
  - [ ] `videoDuration, setVideoDuration`
  - [ ] `videoCompleted, setVideoCompleted`
  - [ ] `fanCertified, setFanCertified`
  - [ ] `ucraVideos, setUcraVideos`
  - [ ] `userCategory, setUserCategory`
  - [ ] `loadingUcraVideos, setLoadingUcraVideos`
  - [ ] `chatRooms, setChatRooms`
  - [ ] `loadingRooms, setLoadingRooms`
  - [ ] `roomLikes, setRoomLikes`
  - [ ] `visibleRoomsCount, setVisibleRoomsCount`
  - [ ] `videoEnded, setVideoEnded`
  - [ ] `playerLoading, setPlayerLoading`
- [ ] `useRef` 참조들:
  - [ ] `playerRef`
  - [ ] `currentVideoRef`

### 🔄 **useEffect 훅들**
- [ ] YouTube 에러 억제 useEffect
- [ ] 사용자 카테고리 정보 가져오기 useEffect
- [ ] UCRA 등록된 영상들 가져오기 useEffect
- [ ] 기본 영상 fetch useEffect
- [ ] 채팅방 데이터 가져오기 useEffect
- [ ] 컴포넌트 언마운트 정리 useEffect

### 🎮 **이벤트 핸들러들**
- [ ] `handleRoomClick` - 채팅방 클릭
- [ ] `handleSearch` - 검색 실행
- [ ] `handleSearchKeyDown` - 검색 엔터키
- [ ] `handleVideoSelect` - 영상 선택
- [ ] `handleYoutubeReady` - YouTube 플레이어 준비
- [ ] `handleYoutubeStateChange` - YouTube 상태 변경
- [ ] `handleYoutubeEnd` - YouTube 영상 종료
- [ ] `handleFanCertification` - 팬 인증
- [ ] `handleLikeToggle` - 좋아요 토글

### 🛠️ **유틸리티 함수들**
- [ ] `computeUniqueVideos` - 중복 영상 제거
- [ ] `canCertify` - 인증 가능 여부 계산
- [ ] 기타 헬퍼 함수들

### 🎨 **UI 컴포넌트 구조**
- [ ] 로딩 상태 UI
- [ ] 에러 상태 UI
- [ ] 헤더 섹션
- [ ] 실시간 인기 채팅방 섹션
- [ ] 검색창
- [ ] 채팅방 리스트
- [ ] 실시간 시청순위 섹션
- [ ] 영상 카드들
- [ ] YouTube 플레이어
- [ ] 인증/좋아요 버튼들

---

## 🏗️ **분리 계획**

### 1단계: 상수 분리
- [ ] `src/components/Home/utils/constants.js`
  - [ ] `API_KEY` 이동
  - [ ] `CATEGORY_KEYWORDS` 이동

### 2단계: 유틸리티 함수 분리
- [ ] `src/components/Home/utils/videoUtils.js`
  - [ ] `computeUniqueVideos` 이동
  - [ ] 영상 관련 헬퍼 함수들

### 3단계: 커스텀 훅 분리
- [ ] `src/components/Home/hooks/useUserCategory.js`
- [ ] `src/components/Home/hooks/useVideos.js`
- [ ] `src/components/Home/hooks/useChatRooms.js`
- [ ] `src/components/Home/hooks/useYouTubePlayer.js`

### 4단계: UI 컴포넌트 분리
- [ ] `src/components/Home/components/Header.js`
- [ ] `src/components/Home/components/SearchSection.js`
- [ ] `src/components/Home/components/PopularChatRooms.js`
- [ ] `src/components/Home/components/VideoRankingList.js`
- [ ] `src/components/Home/components/VideoCard.js`
- [ ] `src/components/Home/components/VideoPlayer.js`

### 5단계: 메인 컴포넌트 정리
- [ ] `src/components/Home/index.js` - 조립만 담당

---

## ⚠️ **각 단계별 검증 사항**

### 🧪 **기능 테스트**
- [ ] 홈 페이지 로딩
- [ ] 영상 목록 표시
- [ ] 채팅방 목록 표시
- [ ] 검색 기능
- [ ] 영상 재생
- [ ] 좋아요/인증 기능
- [ ] 카테고리 필터링

### 📱 **브라우저 테스트**
- [ ] Chrome 정상 작동
- [ ] 모바일 뷰 정상 작동
- [ ] 콘솔 에러 없음

### 💾 **Git 커밋**
- [ ] 각 단계마다 커밋
- [ ] 의미있는 커밋 메시지
- [ ] 롤백 가능한 상태 유지

---

## 🚨 **비상 계획**
- **문제 발생 시**: `git checkout main` 으로 즉시 복구
- **부분 롤백**: `git reset --hard HEAD~1` 로 이전 단계 복구
- **원본 비교**: `diff Home.js Home_ORIGINAL_BACKUP.js` 로 차이점 확인

---

## 📝 **진행 상황**
- **시작일**: 2024-12-19
- **현재 단계**: 준비 완료
- **다음 단계**: 상수 분리 