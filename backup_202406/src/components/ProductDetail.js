import React from "react";
import { useParams, useNavigate } from "react-router-dom";

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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = dummyProducts.find(p => p.id === Number(id));

  if (!product) return <div className="p-8 text-center text-red-500">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:underline">← 뒤로가기</button>
      <img src={product.image} alt={product.name} className="w-40 h-40 object-cover rounded mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2 text-center">{product.name}</h2>
      <div className="text-gray-500 text-center mb-2">{product.description}</div>
      <div className="text-blue-600 font-bold text-xl text-center mb-2">{product.price.toLocaleString()}원</div>
      {product.type === "group" && (
        <div className="text-sm text-pink-600 mb-2 text-center">그룹 구독 · {product.currentMembers}/{product.maxMembers}명 참여중</div>
      )}
      <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition font-bold mt-4">
        {product.type === "group" ? "그룹 구독하기" : "솔로 구독하기"}
      </button>
    </div>
  );
} 