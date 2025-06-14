# Contributing to **YouCra v03 (유크라)**

이 문서는 팀원·AI 모델·외부 기여자가 공통으로 따라야 할 **코딩·PR·CI 규칙**을 정의합니다. 규칙을 지키면 `main` 브랜치 품질이 안정적으로 유지되고, 작은 버그가 대형 장애로 번지는 것을 막을 수 있습니다.

---

## 1. React 패턴 & 코딩 규칙

| 구분 | 규칙 |
|------|------|
| **Key** | `map` / `forEach` 렌더링 시 `key` 는 **백엔드에서 보장된 고유 ID** 사용.<br/>  • `key={video.videoId}` OK<br/>  • `key={index}` / `key={Date.now()}` → **금지** |
| **상태** | 동일 의미의 state (source of truth) 는 **단일 useState** 로만 관리.<br/> 예) `selectedVideoId` 하나만 존재해야 함 |
| **Effect** | 타이머·리스너는 `useEffect` 내에서 생성 → return clean-up 필수.<br/>DOM 직접 조작(`iframe.remove()`, `destroy()`) 또는 setState 남용 금지 |
| **로딩 UI** | 로딩 오버레이 등은 **React state** 로만 제어. DOM 직접 스타일 변경 X |

### ESLint 설정
`eslint-config-react` + `eslint-plugin-react`
```jsonc
"rules": {
  "react/jsx-key": "error",
  "react/no-array-index-key": "error",
  "no-unused-vars": "warn"
}
```

---

## 2. 브랜치 · PR 원칙

1. **작은 PR** (파일 1-3개, 변경 로직 1개)
2. PR 템플릿 필수 작성
   * 변경 목적(버그/기능)
   * 재현 Steps & 스크린샷
   * 영향 범위
3. **원인 중심 수정** : 증상 억제(`console.warn` 무시 등)만으로 문제를 가리지 말 것
4. 머지 전 **CI 통과** 필수

---

## 3. CI 파이프라인

```sh
npm run lint  # ESLint
npm test      # Jest + RTL
```

* 둘 중 하나라도 실패하면 PR 머지 불가
* Jest 예시 테스트
  * "영상 카드 클릭 → YouTube 컴포넌트 하나만 렌더" 검증

---

## 4. 커밋 메시지 규칙 (Angular Style)

```
fix(home): selectedVideoId 타이포 수정
feat(chat): 실시간 참여자 그래프 추가
```

---

### 문의/피드백
* Slack #youcra-dev 채널 또는 GitHub Issue에 등록

이 문서를 업데이트할 때는 **모든 팀원 리뷰** 후 `main`에 머지합니다. 감사합니다! 🙌 