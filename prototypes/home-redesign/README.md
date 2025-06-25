# YouCRA 홈 탭 리디자인 프로토타입

## 📱 개요
YouCRA v03의 새로운 홈 탭 디자인 프로토타입입니다. 
모바일 앱 스타일의 UI/UX로 완전히 리디자인되었습니다.

## 🎯 주요 기능

### 1. 📲 모바일 앱 레이아웃
- 전체 화면 활용 (가로 영역 100%)
- 유크라 브랜딩 헤더 + 기능 아이콘
- 고정 하단 네비게이션 (5개 탭)

### 2. 🎬 시청 교류 시스템
- 채널 등록 (YouTube 핸들/URL)
- 카테고리 선택 (최대 2개)
- 영상 선택 (최대 3개)
- 노출수 포인트 시스템

### 3. 📊 실시간 피드백
- 시청 진행률 표시
- 포인트 증가 애니메이션
- 등급별 노출 효과 분석
- 시청 균형 시스템

### 4. 🔄 상호 작용
- 숏폼/롱폼 분리 필터
- 구독/좋아요 버튼
- 새 영상 자동 추가
- 시청 시뮬레이션

## 🚀 실행 방법
```bash
# 브라우저에서 직접 열기
open index.html

# 또는 로컬 서버 실행
python -m http.server 8000
# http://localhost:8000 접속
```

## 📋 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **스타일링**: Tailwind-like 유틸리티 + 커스텀 CSS
- **아이콘**: 이모지 기반 시스템
- **애니메이션**: CSS Transitions + Transform

## 🎨 디자인 시스템

### 색상 팔레트
```css
/* 유크라 브랜드 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--background: #f8fafc;
--card: #ffffff;
--border: #f1f5f9;

/* 상태 색상 */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### 컴포넌트
- **헤더**: 그라디언트 + 기능 아이콘
- **카드**: 흰색 배경 + 부드러운 그림자
- **버튼**: 라운드 + 호버 효과
- **네비게이션**: 고정 하단 + 배지

## 📁 파일 구조
```
prototypes/home-redesign/
├── index.html          # 메인 프로토타입 파일
├── README.md          # 이 문서
└── assets/            # 향후 에셋 파일들
    ├── images/
    ├── icons/
    └── sounds/
```

## 🔧 개발 노트

### 다음 단계
1. **React 컴포넌트 분리**: HTML → JSX 변환
2. **Firebase 연동**: 실제 데이터 바인딩
3. **YouTube API**: 실제 영상 데이터
4. **상태 관리**: Context API 적용
5. **라우팅**: React Router 연동

### 알려진 이슈
- [ ] 실제 YouTube API 연동 필요
- [ ] Firebase 데이터 구조 설계
- [ ] 반응형 태블릿 최적화
- [ ] 접근성 개선 (aria-label 등)

## 📞 연락처
YouCRA 개발팀 - ucrachat.com

---
© 2025 YouCRA - 크리에이터와 팬을 연결하는 시청 교류 플랫폼 