// src/components/Report.js
import React from "react";
import { Link } from "react-router-dom";

const dummyProducts = [
  {
    id: 1,
    name: "AI 영상 편집 구독 (솔로)",
    price: 29000,
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    description: "혼자서 단독으로 사용하는 AI 영상 편집 구독 서비스",
    type: "solo",
  },
  {
    id: 2,
    name: "AI 영상 편집 구독 (그룹)",
    price: 5000,
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    description: "여러 명이 함께 저렴하게 구독하는 그룹 상품 (AI 영상 편집)",
    type: "group",
    currentMembers: 2,
    maxMembers: 4,
  },
  {
    id: 3,
    name: "AI 썸네일 생성 구독 (솔로)",
    price: 15000,
    image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80",
    description: "혼자서 단독으로 사용하는 AI 썸네일 생성 구독 서비스",
    type: "solo",
  },
  {
    id: 4,
    name: "AI 썸네일 생성 구독 (그룹)",
    price: 7000,
    image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80",
    description: "여러 명이 함께 저렴하게 구독하는 그룹 상품 (AI 썸네일 생성)",
    type: "group",
    currentMembers: 3,
    maxMembers: 4,
  },
];

function Report() {
  return (
    <div className="max-w-md mx-auto mt-6 p-0 bg-transparent">
      {/* 상단 공구 아이콘 + UCRA공구 좌측 정렬 */}
      <div className="flex flex-col items-start mb-4 ml-4">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a2.25 2.25 0 113.182 3.182l-9.193 9.193a2.25 2.25 0 01-1.06.592l-3.25.813a.75.75 0 01-.91-.91l.813-3.25a2.25 2.25 0 01.592-1.06l9.193-9.193z" /></svg>
          <span className="text-2xl font-bold text-gray-900">UCRA공구</span>
        </div>
      </div>
      {/* 상품 카드 리스트 (1열) */}
      <div className="grid grid-cols-2 gap-6 px-2">
        {dummyProducts.map((product) => (
          <Link to={`/product/${product.id}`} key={product.id} className="bg-white rounded-2xl shadow border border-gray-100 px-6 py-6 flex flex-col items-center max-w-full cursor-pointer hover:shadow-lg transition">
            <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded mb-4 shadow-sm" />
            <div className="font-bold text-xl mb-1 text-center">{product.name}</div>
            <div className="text-gray-500 text-base mb-2 text-center">{product.description}</div>
            <div className="font-bold text-blue-600 text-lg mb-2 text-center">{product.price.toLocaleString()}원</div>
            {product.type === "group" && (
              <div className="text-sm text-pink-600 mb-2 text-center font-semibold">그룹 구독 · {product.currentMembers}/{product.maxMembers}명 참여중</div>
            )}
            <button
              className={`w-full py-3 rounded-lg font-bold text-base mt-2 ${product.type === "group" ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-500 hover:bg-blue-600"} text-white transition`}
              onClick={e => e.preventDefault()}
            >
              {product.type === "group" ? "그룹 구독하기" : "솔로 구독하기"}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Report;