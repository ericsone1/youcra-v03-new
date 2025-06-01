# YouCra v03 프로젝트 상세 문서

## 📋 프로젝트 정보
- **프로젝트명**: YouCra v03 (유크라)
- **개발기간**: 2024년 6월~
- **배포 URL**: https://ucrachat.com
- **GitHub**: 로컬 개발 환경
- **개발자**: 개인 프로젝트

## 🎯 비즈니스 목표
YouTube 크리에이터와 팬들을 위한 **통합 소셜 플랫폼**
- 크리에이터가 팬들과 실시간으로 소통할 수 있는 채팅방 제공
- YouTube 영상을 공유하고 함께 시청하는 기능
- 팬 인증 시스템으로 충성도 높은 팬 커뮤니티 구축

## 🏗️ 아키텍처

### Frontend (React)
```
src/
├── components/          # UI 컴포넌트
│   ├── Home.js         # 메인 페이지 (YouTube 피드)
│   ├── ChatList.js     # 채팅방 목록
│   ├── ChatRoom.js     # 채팅방 (핵심 기능)
│   ├── MyChannel.js    # 마이채널
│   ├── GoogleAuth.js   # Google 로그인
│   └── AuthForm.js     # 로그인 폼
├── contexts/           # React Context
│   └── AuthContext.js  # 인증 상태 관리
├── services/           # 비즈니스 로직
│   ├── userService.js  # 사용자 관리
│   ├── chatService.js  # 채팅 관리
│   └── videoService.js # 영상 관리
├── utils/              # 유틸리티
│   ├── youtube.js      # YouTube API 헬퍼
│   └── errorHandler.js # 에러 처리
└── hooks/              # 커스텀 훅
```

### Backend (Firebase)
```
Firebase Services:
├── Authentication      # 사용자 인증
├── Firestore          # 실시간 데이터베이스
├── Storage            # 파일 저장소
└── Analytics          # 사용자 분석
```

### External APIs
- **YouTube Data API v3**: 영상 정보, 좋아요, 구독
- **Google Identity Services**: OAuth 2.0 로그인

## 🔧 핵심 기능 상세

### 1. 인증 시스템
**이중 인증 구조**: Firebase Auth + Google OAuth
```javascript
// AuthContext.js에서 두 가지 로그인 상태 관리
- Firebase 로그인: 이메일/비밀번호
- Google 로그인: OAuth 2.0 (YouTube API 연동 위해)
```

**GoogleAuth.js 주요 기능:**
- Google Identity Services (GSI) 최신 구현
- JWT 토큰 파싱 및 사용자 정보 추출
- 상세한 오류 처리 (unregistered_origin 등)

### 2. 실시간 채팅
**Firestore 실시간 리스너 활용:**
```javascript
// 채팅방 구조
chatRooms/{roomId}/
├── messages/           # 메시지들
├── participants/       # 참여자들
└── videos/            # 등록된 영상들
```

**주요 기능:**
- 실시간 메시지 송수신
- 이미지 업로드 (Firebase Storage)
- 이모지 지원
- 긴 누르기로 메시지 삭제
- 참여자 실시간 표시

### 3. YouTube 통합
**YouTube API 활용:**
- 영상 URL 자동 감지 및 미리보기
- 영상 메타데이터 (제목, 썸네일, 채널) 자동 추출
- 팝업 플레이어 (드래그 가능)
- 영상 시청 시간 추적

**팬 인증 시스템:**
- 영상을 끝까지 시청하면 "팬 인증" 가능
- 크리에이터와 팬 간의 특별한 상호작용

### 4. 라우팅 및 네비게이션
```javascript
// App.js 라우팅 구조
Routes:
├── / (Home)              # YouTube 피드
├── /chat (ChatList)      # 채팅방 목록
├── /chat/:roomId         # 특정 채팅방
├── /my (MyChannel)       # 마이채널
├── /report              # 인기 리포트
├── /login               # 로그인
├── /profile/:roomId/:uid # 사용자 프로필
├── /dm/:uid             # 1:1 DM
├── /videos              # 영상 목록
└── /add-video           # 영상 추가
```

## 🎨 UI/UX 설계

### 모바일 퍼스트 디자인
- **하단 네비게이션**: 홈/채팅방/리포트/마이채널
- **카드 기반 UI**: 깔끔한 카드 레이아웃
- **Tailwind CSS**: 일관된 디자인 시스템

### 색상 및 브랜딩
```css
Primary: Blue (#3B82F6)
Background: Light Blue (#F7FAFF)
Cards: White with shadows
Accent: Red for YouTube elements
```

## 🔐 보안 및 권한

### Firebase Security Rules
```javascript
// Firestore 규칙 예시
chatRooms: {
  read: if request.auth != null;
  write: if request.auth != null;
}
```

### 환경변수 관리
- 개발환경: `.env` 파일
- 프로덕션: Vercel 환경변수
- Google API 키 보안 관리

## 📊 데이터 모델

### Users Collection
```javascript
users/{userId}: {
  nickname: string,
  profileImage: string,
  email: string,
  uid: string,
  point: number,
  channelLink: string,
  createdAt: timestamp
}
```

### ChatRooms Collection
```javascript
chatRooms/{roomId}: {
  name: string,
  createdAt: timestamp,
  createdBy: string,
  maxParticipants: number,
  profileImage: string
}
```

### Messages SubCollection
```javascript
chatRooms/{roomId}/messages/{messageId}: {
  text: string,
  uid: string,
  nickname: string,
  profileImage: string,
  createdAt: timestamp,
  imageUrl?: string
}
```

## 🚀 배포 및 CI/CD

### Vercel 배포
- **도메인**: ucrachat.com (후이즈에서 구매)
- **DNS 설정**: A 레코드 → 76.76.21.21
- **자동 배포**: Git push 시 자동 빌드

### 환경변수 설정
```bash
# Vercel Production 환경변수
REACT_APP_GOOGLE_CLIENT_ID=234134940808-jtnudlrb28o2hheq2ppmfr4rocgn09pj.apps.googleusercontent.com
REACT_APP_YOUTUBE_API_KEY=[보안]
```

## 🐛 알려진 이슈 및 해결방안

### 1. Google OAuth "unregistered_origin" 오류
**문제**: Google Cloud Console에서 Origin 미등록
**해결**: 승인된 JavaScript 원본에 도메인 추가

### 2. YouTube API 할당량 초과
**문제**: 일일 API 호출 한도 초과
**해결**: API 키 로테이션 또는 할당량 증가 요청

### 3. Firebase Firestore 읽기 비용
**문제**: 실시간 리스너로 인한 과도한 읽기
**해결**: 필요한 필드만 구독, 캐싱 활용

## 📈 향후 개발 계획

### 단기 (1-2개월)
- [ ] 푸시 알림 기능
- [ ] 영상 재생목록 기능
- [ ] 채팅방 카테고리 분류

### 중기 (3-6개월)
- [ ] 크리에이터 수익화 시스템
- [ ] 라이브 스트리밍 연동
- [ ] 팬클럽 멤버십 기능

### 장기 (6개월+)
- [ ] AI 추천 시스템
- [ ] 다국어 지원
- [ ] 모바일 앱 개발

## 🔍 성능 모니터링

### Firebase Analytics
- 사용자 행동 추적
- 페이지 뷰 및 체류 시간
- 채팅방 참여율

### 핵심 지표 (KPI)
- 일일 활성 사용자 (DAU)
- 채팅방 생성율
- 영상 시청 완료율
- 팬 인증 달성율

## 📞 개발 지원

### 디버깅 도구
- React DevTools
- Firebase Console
- Chrome DevTools
- Vercel 배포 로그

### 테스트 전략
- 컴포넌트 단위 테스트 (Jest)
- Firebase 에뮬레이터 활용
- 실제 사용자 테스트 