export default function formatTime(sec=0){
  const m=Math.floor(sec/60).toString().padStart(2,'0');
  const s=Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
} 