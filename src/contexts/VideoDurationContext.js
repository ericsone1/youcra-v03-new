import React, { createContext, useContext, useReducer } from 'react';

// Context 생성
const VideoDurationContext = createContext(null);
const VideoDurationDispatchContext = createContext(null);

// 초기 상태
const initialState = {};

// Reducer 함수
function durationReducer(state, action) {
  switch (action.type) {
    case 'SET_DURATION': {
      return {
        ...state,
        [action.videoId]: action.duration
      };
    }
    case 'SET_MULTIPLE_DURATIONS': {
      return {
        ...state,
        ...action.durations
      };
    }
    case 'CLEAR_DURATIONS': {
      return {};
    }
    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}

// Provider 컴포넌트
export function VideoDurationProvider({ children }) {
  const [durations, dispatch] = useReducer(durationReducer, initialState);

  return (
    <VideoDurationContext.Provider value={durations}>
      <VideoDurationDispatchContext.Provider value={dispatch}>
        {children}
      </VideoDurationDispatchContext.Provider>
    </VideoDurationContext.Provider>
  );
}

// Custom Hooks
export function useVideoDurations() {
  const context = useContext(VideoDurationContext);
  if (context === null) {
    throw new Error('useVideoDurations must be used within VideoDurationProvider');
  }
  return context;
}

export function useVideoDurationDispatch() {
  const context = useContext(VideoDurationDispatchContext);
  if (context === null) {
    throw new Error('useVideoDurationDispatch must be used within VideoDurationProvider');
  }
  return context;
}

// 편의 함수들
export function useVideoDuration(videoId) {
  const durations = useVideoDurations();
  return durations[videoId] || null;
}

export function useSetVideoDuration() {
  const dispatch = useVideoDurationDispatch();
  
  return {
    setDuration: (videoId, duration) => {
      dispatch({
        type: 'SET_DURATION',
        videoId,
        duration
      });
    },
    setMultipleDurations: (durations) => {
      dispatch({
        type: 'SET_MULTIPLE_DURATIONS',
        durations
      });
    },
    clearDurations: () => {
      dispatch({
        type: 'CLEAR_DURATIONS'
      });
    }
  };
} 