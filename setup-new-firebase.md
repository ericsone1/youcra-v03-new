# 🔥 Firebase v03.1 새 프로젝트 설정 가이드

## 1. Firebase Console에서 프로젝트 생성
- 프로젝트 ID: `youcra-v03-1` 또는 `youcra031` 
- 표시 이름: `YouCra v03.1`

## 2. 서비스 활성화
### Firestore Database
1. "Firestore Database" → "데이터베이스 만들기"
2. 보안 규칙: "테스트 모드로 시작" 선택
3. 위치: `asia-northeast3 (서울)` 선택

### Authentication  
1. "Authentication" → "시작하기"
2. Sign-in method → "Google" 활성화
3. 프로젝트 지원 이메일 설정

### Storage (선택사항)
1. "Storage" → "시작하기" 
2. 보안 규칙: 기본값 사용

## 3. 웹 앱 등록
1. 프로젝트 설정(⚙️) 클릭
2. "앱 추가" → 웹(</>) 아이콘
3. 앱 닉네임: `youcra-v03-1-web`
4. Firebase SDK 설정 코드 복사

## 4. 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 테스트 모드: 모든 읽기/쓰기 허용 (인증된 사용자만)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 5. 다음 단계
- Firebase SDK 설정 코드 받으면 `src/firebase.js` 업데이트
- CLI로 새 프로젝트 연결
- 앱 테스트 