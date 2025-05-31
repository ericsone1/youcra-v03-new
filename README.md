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
```

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
- ✅ 파일 업로드
- ✅ 반응형 UI
- ✅ PWA 지원

## 🛠️ 기술 스택

- **Frontend**: React, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Deployment**: Firebase Hosting
- **Testing**: Jest, React Testing Library

## 📞 지원

문제가 있으시면 이슈를 생성해주세요!
