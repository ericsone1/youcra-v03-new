import React from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const dummyRooms = [
  { name: '유머/일상 유튜버방', desc: '유머와 일상 콘텐츠를 공유하는 유튜버들의 채팅방' },
  { name: '시니어 타겟 방', desc: '시니어 세대를 위한 정보와 소통의 공간' },
  { name: '10~20대 타겟 채널 유튜버 방', desc: '10~20대가 좋아하는 유튜브 채널 모임' },
  { name: '썰채널 유튜버방', desc: '썰 푸는 유튜버와 팬들의 소통방' },
  { name: '주식/경제/부동산 채널 유튜버방', desc: '주식, 경제, 부동산 정보를 나누는 채널' },
  { name: '먹방/쿡방 유튜버방', desc: '먹방, 쿡방 유튜버와 팬들의 모임' },
  { name: '게임 유튜버방', desc: '게임 유튜버와 게이머들의 소통방' },
  { name: '브이로그 유튜버방', desc: '브이로그 유튜버와 일상 공유' },
  { name: '여행/캠핑 유튜버방', desc: '여행, 캠핑 유튜버와 여행 정보 공유' },
  { name: 'IT/테크 유튜버방', desc: 'IT, 테크, 전자기기 리뷰 유튜버 모임' },
  { name: '패션/뷰티 유튜버방', desc: '패션, 뷰티, 스타일링 정보 공유' },
  { name: '음악/커버 유튜버방', desc: '음악, 커버, 악기 연주 유튜버와 팬' },
  { name: '운동/헬스 유튜버방', desc: '운동, 헬스, 다이어트 정보 공유' },
  { name: '교육/공부 유튜버방', desc: '교육, 공부, 자기계발 유튜버 모임' },
  { name: '반려동물 유튜버방', desc: '반려동물, 동물 콘텐츠 유튜버와 팬' },
];

export default function DummyRoomGenerator() {
  const handleGenerate = async () => {
    for (const room of dummyRooms) {
      await addDoc(collection(db, 'chatRooms'), {
        name: room.name,
        desc: room.desc,
        createdAt: serverTimestamp(),
        createdBy: 'admin',
      });
    }
    alert('더미 채팅방 15개가 생성되었습니다!');
  };

  return (
    <button
      style={{ padding: 16, background: '#007bff', color: 'white', fontWeight: 'bold', borderRadius: 8, marginTop: 24 }}
      onClick={handleGenerate}
    >
      더미 채팅방 15개 생성
    </button>
  );
} 