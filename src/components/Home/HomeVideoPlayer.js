// 🎬 홈 비디오 플레이어 메인 진입점
// 리팩토링: 715줄 → 10줄로 단순화

import React from 'react';
import VideoPlayerCore from './VideoPlayerCore';

export default function HomeVideoPlayer(props) {
  return <VideoPlayerCore {...props} />;
} 