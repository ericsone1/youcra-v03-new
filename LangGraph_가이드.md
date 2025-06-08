# LangGraph 완전 가이드

## 📖 개요

**LangGraph**는 그래프 데이터 구조를 사용하여 복잡한 워크플로우를 정의하고 제어하는 Python 라이브러리입니다. 특히 대규모 언어 모델(LLM)을 활용한 복잡한 애플리케이션 개발에 최적화되어 있습니다.

## 🔑 핵심 개념

### 1. 노드와 엣지 (Nodes & Edges)

- **노드(Nodes)**: Python 함수들로, 각각 고유한 작업 단위를 나타냄
- **엣지(Edges)**: 함수들 사이의 실행 순서와 조건을 정의

```python
# 노드 예시
def research_topic(state: MyGraphState) -> dict:
    topic = state["input_topic"]
    print(f"연구 중인 주제: {topic}")
    notes = [f"{topic}에 대한 노트 1", f"{topic}에 대한 노트 2"]
    return {"research_notes": notes}
```

### 2. 상태 관리 (Stateful Nature)

LangGraph의 모든 그래프는 상태와 함께 작동합니다.

- **그래프의 메모리**: 실행 전체에 걸쳐 지속되는 메모리 역할
- **맵 객체**: 일반적으로 Python 딕셔너리 또는 TypedDict 사용
- **노드 상호작용**: 
  - 입력: 모든 노드는 현재 상태 객체를 매개변수로 받아야 함
  - 출력 및 병합: 노드는 딕셔너리를 반환하고, 이는 메인 그래프 상태에 병합됨

```python
from typing import TypedDict, List

# 상태 구조 정의
class MyGraphState(TypedDict):
    input_topic: str
    research_notes: List[str]
    draft_content: str
    critique: str
    final_answer: str

# 노드 함수
def research_topic(state: MyGraphState) -> dict:
    topic = state["input_topic"]
    print(f"주제 연구 중: {topic}")
    notes = [f"{topic}에 대한 노트 1", f"{topic}에 대한 노트 2"]
    return {"research_notes": notes}

def draft_article(state: MyGraphState) -> dict:
    notes = state["research_notes"]
    topic = state["input_topic"]
    print(f"{topic}에 대해 {len(notes)}개의 노트를 기반으로 초안 작성 중")
    draft = f"{topic}에 대한 초안: {'; '.join(notes)}"
    return {"draft_content": draft}
```

### 3. 인터럽트 (Interrupts)

그래프 실행을 일시 중단하고 외부 입력을 기다리는 기능입니다.

- **용도**: 인간의 승인이나 추가 정보 수집이 필요한 경우
- **구현**: 특정 노드 실행 전에 인터럽트 지정
- **재개**: 상태가 저장되어 나중에 재개 가능

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# 인터럽트 설정
memory = MemorySaver()
app = workflow.compile(
    checkpointer=memory,
    interrupt_before=["get_human_answer"]  # 인터럽트 지점
)

# 실행 및 재개
config = {"configurable": {"thread_id": "session_1"}}
current_state = app.invoke(None, config=config)  # 인터럽트까지 실행

# 인간 입력 제공 후 재개
human_input = "Python을 선호합니다. 가독성이 좋고 라이브러리가 풍부하기 때문입니다."
app.invoke({"answer": human_input}, config=config)  # 재개
```

### 4. 시간 여행 (Time Travel)

그래프 실행 히스토리를 저장하고 과거 특정 시점으로 되돌아가는 기능입니다.

- **실행 히스토리**: 체크포인터가 각 단계의 상태 스냅샷 저장
- **되돌리기**: 과거 상태 목록에서 특정 시점 선택
- **재개**: 선택한 체크포인트부터 새로운 경로로 실행

```python
# 히스토리 조회
history = app.get_state_history(config)
for i, state_snapshot in enumerate(history):
    print(f"스냅샷 {i}:")
    print(f"  타임스탬프: {state_snapshot.config['configurable']['thread_ts']}")
    print(f"  상태 값: {state_snapshot.values}")

# 특정 시점으로 되돌리기
target_ts = "specific_timestamp"
rewind_config = {
    "configurable": {
        "thread_id": "session_1",
        "thread_ts": target_ts  # 시간 여행의 핵심!
    }
}

# 되돌린 지점부터 새로운 입력으로 재개
app.invoke({"answer": "다른 답변!"}, config=rewind_config)
```

## 🎯 왜 그래프가 필요한가?

실제 애플리케이션, 특히 LLM을 포함한 애플리케이션에서는 다음이 필요합니다:

1. **구성 가능한 순서**: "정보 검색 → 답변 합성 → 출력 포맷팅" 같은 정확한 순서 정의
2. **조건부 로직**: 출력에 따라 다른 후속 함수로 분기
3. **사이클/루프**: 특정 조건이 만족될 때까지 단계 반복
4. **모듈성과 재사용성**: 작고 관리 가능한 재사용 컴포넌트로 복잡한 시스템 구축

## 💻 완전한 예제

```python
from typing import TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# 1. 상태 정의
class InterviewState(TypedDict):
    question: str
    answer: str
    turn_count: int
    interview_log: Annotated[list[tuple[str, str]], operator.add]

# 2. 노드 함수 정의
def ask_question_node(state: InterviewState) -> dict:
    turn = state.get("turn_count", 0) + 1
    if turn == 1:
        question = "안녕하세요! 가장 좋아하는 프로그래밍 언어와 그 이유는 무엇인가요?"
    elif turn == 2:
        question = "흥미롭네요. 그 언어로 만든 자랑스러운 프로젝트가 있나요?"
    else:
        question = "공유해 주셔서 감사합니다!"
    
    print(f"\n면접관 (그래프): {question}")
    return {
        "question": question, 
        "turn_count": turn, 
        "interview_log": [("면접관", question)]
    }

def get_human_answer_node(state: InterviewState) -> dict:
    human_answer = state.get("answer", "아직 답변이 제공되지 않았습니다.")
    print(f"지원자 (당신): {human_answer}")
    return {"interview_log": [("지원자", human_answer)]}

# 3. 조건부 로직 정의
def route_after_question(state: InterviewState):
    if state["turn_count"] >= 3 and "감사합니다" in state["question"]:
        return "end_interview"
    return "get_human_answer"

# 4. 그래프 구성
workflow = StateGraph(InterviewState)
workflow.add_node("ask_question", ask_question_node)
workflow.add_node("get_human_answer", get_human_answer_node)

workflow.set_entry_point("ask_question")

workflow.add_conditional_edges(
    "ask_question",
    route_after_question,
    {
        "get_human_answer": "get_human_answer",
        "end_interview": END,
    },
)
workflow.add_edge("get_human_answer", "ask_question")

# 5. 컴파일 및 실행
memory = MemorySaver()
app = workflow.compile(
    checkpointer=memory,
    interrupt_before=["get_human_answer"]
)

# 실행
thread_id = "my_interview_1"
config = {"configurable": {"thread_id": thread_id}}

print("--- 면접 시작 ---")
current_state = app.invoke(None, config=config)

# 첫 번째 답변 제공
human_input_1 = "Python입니다. 가독성이 뛰어나고 라이브러리가 풍부하기 때문입니다."
app.invoke({"answer": human_input_1}, config=config)
```

## 🚀 YouCra v03 프로젝트에서의 활용

### 1. YouTube 영상 분석 워크플로우
```python
class VideoAnalysisState(TypedDict):
    video_url: str
    transcript: str
    summary: str
    keywords: list[str]
    chat_message: str

# 노드들: 트랜스크립트 추출 → 요약 생성 → 키워드 추출 → 채팅 메시지 생성
```

### 2. 실시간 채팅 모더레이션
```python
class ModerationState(TypedDict):
    message: str
    user_info: dict
    risk_score: float
    action: str
    notification: str

# 노드들: 메시지 분석 → 위험도 평가 → 조치 결정 → 알림 생성
```

### 3. 팬 인증 프로세스
```python
class FanVerificationState(TypedDict):
    user_id: str
    channel_id: str
    verification_data: dict
    verification_status: str
    permissions: list[str]

# 노드들: 사용자 확인 → 채널 연결 확인 → 권한 부여 → 알림 전송
```

## 📋 주요 특징 요약

- ✅ **상태 기반**: 전체 워크플로우에 걸친 데이터 지속성
- ✅ **인터럽트 지원**: 인간 개입이 필요한 지점에서 일시 중단
- ✅ **시간 여행**: 과거 상태로 되돌아가서 다른 경로 탐색
- ✅ **조건부 분기**: 복잡한 로직과 의사결정 트리 구현
- ✅ **모듈성**: 재사용 가능한 컴포넌트로 구성
- ✅ **LLM 최적화**: 대규모 언어 모델과의 통합에 특화

## 🔧 설치 및 시작하기

```bash
pip install langgraph
```

```python
from langgraph.graph import StateGraph
from langgraph.checkpoint.memory import MemorySaver

# 기본 그래프 생성 및 실행
workflow = StateGraph(YourStateClass)
# 노드 추가, 엣지 정의, 컴파일, 실행
```

LangGraph는 복잡한 AI 워크플로우를 체계적이고 유연하게 관리할 수 있는 강력한 도구입니다! 🎯 