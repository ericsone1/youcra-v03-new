# YouCra Chat App 🔥

실시간 채팅 애플리케이션 with Firebase

## 🚀 Firebase 프로젝트 설정하기

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com) 접속
2. **프로젝트 만들기** 클릭
3. 프로젝트 이름 입력 (예: `youcra-chat-app`)
4. Google Analytics 사용 여부 선택
5. **프로젝트 만들기** 완료

### 2. 웹 앱 등록
1. Firebase Console에서 **</> 웹** 아이콘 클릭
2. 앱 이름 입력 (예: `YouCra Chat`)
3. **Firebase Hosting** 체크 (선택사항)
4. **앱 등록** 클릭

### 3. Firebase 서비스 활성화

#### 📧 Authentication (인증)
1. 좌측 메뉴 **Authentication** 클릭
2. **시작하기** 클릭
3. **Sign-in method** 탭
4. **이메일/비밀번호** 활성화

#### 🗄️ Firestore Database
1. 좌측 메뉴 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택
4. 지역 선택 (asia-northeast3 - Seoul 권장)

#### 📁 Storage
1. 좌측 메뉴 **Storage** 클릭
2. **시작하기** 클릭
3. **테스트 모드로 시작** 선택

### 4. 환경변수 설정
1. Firebase Console > 프로젝트 설정 (⚙️) > SDK 설정 및 구성
2. **구성** 복사
3. 프로젝트 루트에 `.env` 파일의 값들을 실제 값으로 교체:

```bash
REACT_APP_FIREBASE_API_KEY=your_actual_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
REACT_APP_FIREBASE_APP_ID=your_actual_app_id

# YouTube API 설정
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 5. Google API 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. YouTube Data API v3 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 JavaScript 출처에 도메인 추가

## 🏗️ 로컬 개발 환경 설정

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm start
```

### 빌드
```bash
npm run build
```

## 🌐 배포하기

### Firebase Hosting으로 배포
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 배포
firebase deploy
```

## 📱 주요 기능

- ✅ 실시간 채팅
- ✅ 사용자 인증 (이메일/비밀번호)
- ✅ 파일 업로드 (이미지, 동영상, 문서)
- ✅ YouTube 영상 공유 및 플레이어
- ✅ 시청 인증 시스템
- ✅ 반응형 UI
- ✅ PWA 지원

### 🎬 YouTube 시청 인증 조건

UCRA에서는 YouTube 영상 시청 후 팬 인증을 받을 수 있습니다.

**인증 조건:**
- **3분 이상 영상**: 3분(180초) 시청 시 인증 가능
- **3분 미만 영상**: 영상을 끝까지 시청해야 인증 가능

**적용 범위:**
- 홈 페이지 YouTube 플레이어
- 채팅방 내 팝업 영상 플레이어

**구현 로직:**
```javascript
// 인증 가능 여부 판단
const canCertify = videoDuration > 0 
  ? (videoDuration >= 180 ? watchSeconds >= 180 : videoEnded)
  : watchSeconds >= 180;
```

**사용자 경험:**
- 짧은 영상(쇼츠, 클립): 완주를 통해 충분한 관심도 인정
- 긴 영상(일반 콘텐츠): 3분 시청으로 적절한 참여도 인정

## 🛠️ 기술 스택

- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Firebase (Firestore, Auth, Storage)
- **API**: YouTube Data API v3, Google Identity Services
- **UI Library**: React YouTube, React Modal, React Icons
- **Deployment**: Firebase Hosting
- **Testing**: Jest, React Testing Library

## 📞 지원

문제가 있으시면 이슈를 생성해주세요!
