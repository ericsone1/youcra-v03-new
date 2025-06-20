# 뒤로가기 네비게이션 최적화

이 문서는 YouCra v03 앱의 뒤로가기 기능 최적화 작업을 설명합니다.

## 🚀 최적화 내용

### 1. 스마트 뒤로가기 시스템 (`useNavigationHistory.js`)

#### 주요 기능
- **히스토리 스택 추적**: 사용자의 네비게이션 경로를 자동으로 추적
- **스크롤 위치 보존**: 페이지 간 이동 시 스크롤 위치 자동 저장/복원
- **폴백 경로 지원**: 히스토리가 없는 경우 안전한 경로로 이동
- **메모리 최적화**: 히스토리 스택 크기 제한 (최대 10개)

#### 사용법
```javascript
import { useNavigationHistory, useChatNavigationHistory } from '../hooks/useNavigationHistory';

// 기본 사용
const { handleSmartBack } = useNavigationHistory('/fallback');

// 채팅방 전용
const { handleChatBack } = useChatNavigationHistory();
```

### 2. 스마트 백 버튼 컴포넌트들 (`SmartBackButton.js`)

#### 컴포넌트 종류
- **SmartBackButton**: 기본 스마트 뒤로가기 버튼
- **ChatBackButton**: 채팅방 전용 뒤로가기 버튼
- **HeaderBackButton**: 헤더용 뒤로가기 버튼
- **FloatingBackButton**: 플로팅 뒤로가기 버튼

#### 사용법
```javascript
import SmartBackButton, { ChatBackButton, HeaderBackButton } from './common/SmartBackButton';

// 기본 사용
<SmartBackButton fallbackPath="/home" />

// 채팅방용
<ChatBackButton roomData={roomData} />

// 헤더용
<HeaderBackButton title="설정" fallbackPath="/my" />
```

### 3. 브라우저 뒤로가기 감지 (`BrowserBackHandler.js`)

#### 주요 기능
- **브라우저 뒤로가기 감지**: `popstate` 이벤트 처리
- **컨텍스트별 처리**: 채팅방, 모달 등 상황에 맞는 처리
- **스크롤 복원**: 브라우저 뒤로가기 시 스크롤 위치 복원
- **정리 작업 지원**: 페이지 이탈 전 필요한 정리 작업 실행

#### 사용법
```javascript
import BrowserBackHandler, { ChatRoomBackHandler, ModalBackHandler } from './common/BrowserBackHandler';

// 기본 사용
<BrowserBackHandler onBeforeBack={handleBeforeBack} />

// 채팅방용
<ChatRoomBackHandler roomId={roomId} onLeaveRoom={cleanupFunction} />

// 모달용
<ModalBackHandler isOpen={modalOpen} onClose={closeModal} />
```

### 4. 스크롤 위치 보존 (`useScrollPreservation`)

#### 기능
- **자동 저장**: 페이지 이탈 시 스크롤 위치 자동 저장
- **자동 복원**: 페이지 복귀 시 스크롤 위치 자동 복원
- **키 기반 관리**: 고유 키로 여러 페이지의 스크롤 위치 관리

#### 사용법
```javascript
import { useScrollPreservation } from '../hooks/useNavigationHistory';

function MyComponent() {
  useScrollPreservation('unique-page-key');
  // 자동으로 스크롤 위치가 보존됩니다
}
```

## 📱 적용된 컴포넌트들

### 1. ChatRoom.js
- **스크롤 위치 보존**: 채팅방별로 스크롤 위치 저장
- **스마트 백 버튼**: `ChatBackButton` 컴포넌트 사용 (예정)

### 2. AllChatRooms.js  
- **스마트 백 버튼**: `SmartBackButton`으로 교체
- **스크롤 위치 보존**: 전체 채팅방 목록 스크롤 위치 보존

### 3. ChatRoomHost.js
- **헤더 백 버튼**: `HeaderBackButton`으로 교체
- **폴백 경로**: 채팅방으로 안전하게 돌아가기

### 4. ChatList/index.js
- **스크롤 위치 보존**: 채팅방 목록 스크롤 위치 보존

## 🎯 성능 최적화

### 메모리 관리
- **히스토리 스택 제한**: 최대 10개 경로까지만 저장
- **자동 정리**: 오래된 스크롤 위치 데이터 자동 정리
- **디바운스**: 스크롤 이벤트 디바운싱으로 성능 최적화

### 사용자 경험
- **즉시 반응**: 뒤로가기 버튼 클릭 시 즉시 반응
- **상태 보존**: 읽지 않은 메시지 수, 검색어 등 상태 보존
- **스크롤 복원**: 자연스러운 스크롤 위치 복원

## 🔧 설정 및 커스터마이징

### 폴백 경로 설정
```javascript
const { handleSmartBack } = useNavigationHistory('/custom-fallback');
```

### 스크롤 보존 비활성화
```javascript
<SmartBackButton preserveScroll={false} />
```

### 뒤로가기 전 콜백
```javascript
<SmartBackButton 
  onBeforeBack={async () => {
    await saveData();
    return true; // 뒤로가기 진행
  }}
/>
```

## 🐛 문제 해결

### 스크롤이 복원되지 않는 경우
1. `useScrollPreservation` 훅이 올바르게 사용되었는지 확인
2. 고유한 키를 사용하고 있는지 확인
3. 컴포넌트가 마운트된 후에 스크롤이 발생하는지 확인

### 뒤로가기가 작동하지 않는 경우
1. `SmartBackButton`이 올바른 props를 받고 있는지 확인
2. 폴백 경로가 유효한지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 히스토리 스택이 비어있는 경우
- 새 탭이나 직접 URL 접근 시 발생할 수 있음
- 폴백 경로로 안전하게 이동됨

## 📈 향후 개선 계획

1. **더 많은 컴포넌트 적용**: 모든 페이지에 스마트 뒤로가기 적용
2. **고급 상태 보존**: 더 복잡한 상태 보존 기능 추가
3. **애니메이션 최적화**: 페이지 전환 애니메이션과 연동
4. **접근성 개선**: 스크린 리더 등 접근성 기능 강화

## 🛠️ 개발자 가이드

### 새 컴포넌트에 뒤로가기 추가하기

1. **스마트 백 버튼 추가**:
```javascript
import SmartBackButton from './common/SmartBackButton';

<SmartBackButton fallbackPath="/appropriate-fallback" />
```

2. **스크롤 위치 보존 추가**:
```javascript
import { useScrollPreservation } from '../hooks/useNavigationHistory';

useScrollPreservation('unique-component-key');
```

3. **브라우저 뒤로가기 처리 (필요시)**:
```javascript
import BrowserBackHandler from './common/BrowserBackHandler';

<BrowserBackHandler onBeforeBack={handleCleanup} />
```

이렇게 하면 사용자 친화적인 뒤로가기 경험을 제공할 수 있습니다! 🚀 