import React from "react";
import { useParams, useNavigate } from "react-router-dom";

// Shop.js의 더미 데이터와 동일하게 맞춰줍니다.
const dummyProducts = [
  {
    id: 1,
    name: "소니 ZV-1 유튜브 카메라",
    price: 850000,
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    category: "촬영 장비",
    description: "유튜버를 위한 최고의 브이로그 카메라",
    type: "product"
  },
  {
    id: 2,
    name: "로데 비디오마이크 GO II",
    price: 120000,
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
    category: "촬영 장비",
    description: "선명한 음질을 위한 유튜브용 마이크",
    type: "product"
  },
  {
    id: 3,
    name: "AI 영상 편집 구독 (솔로)",
    price: 29000,
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    category: "AI 구독",
    description: "혼자서 단독으로 사용하는 AI 영상 편집 구독 서비스",
    type: "solo",
    period: "1개월"
  },
  {
    id: 4,
    name: "AI 영상 편집 구독 (그룹)",
    price: 5000,
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    category: "AI 구독",
    description: "여러 명이 함께 저렴하게 구독하는 그룹 상품 (AI 영상 편집)",
    type: "group",
    period: "1개월",
    currentMembers: 2,
    maxMembers: 4
  },
  {
    id: 5,
    name: "AI 썸네일 생성 구독 (솔로)",
    price: 15000,
    image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80",
    category: "AI 구독",
    description: "혼자서 단독으로 사용하는 AI 썸네일 생성 구독 서비스",
    type: "solo",
    period: "1개월"
  },
  {
    id: 6,
    name: "AI 썸네일 생성 구독 (그룹)",
    price: 7000,
    image: "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80",
    category: "AI 구독",
    description: "여러 명이 함께 저렴하게 구독하는 그룹 상품 (AI 썸네일 생성)",
    type: "group",
    period: "1개월",
    currentMembers: 3,
    maxMembers: 4
  },
  {
    id: 7,
    name: "LED 촬영 조명 세트",
    price: 45000,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
    category: "촬영 장비",
    description: "밝고 자연스러운 촬영을 위한 LED 조명",
    type: "product"
  },
];

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = dummyProducts.find(p => p.id === Number(id));

  if (!product) return <div className="p-8 text-center text-red-500">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:underline">← 뒤로가기</button>
      <img src={product.image} alt={product.name} className="w-72 h-72 object-cover rounded mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2 text-center">{product.name}</h2>
      <div className="text-gray-500 text-center mb-2">{product.category}</div>
      <div className="text-blue-600 font-bold text-xl text-center mb-2">{product.price.toLocaleString()}원</div>
      <div className="text-gray-700 text-center mb-4">{product.description}</div>
      {product.type === "solo" && (
        <div className="text-xs text-gray-600 mb-2 text-center">솔로 구독</div>
      )}
      {product.type === "group" && (
        <div className="text-xs text-pink-600 mb-2 text-center">그룹 구독 · {product.currentMembers}/{product.maxMembers}명 참여중</div>
      )}
      {product.period && (
        <div className="text-xs text-green-600 mb-4 text-center">{product.period} 구독</div>
      )}
      <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition">{product.type === "group" ? "그룹 구독하기" : product.type === "solo" ? "솔로 구독하기" : "구매하기"}</button>
    </div>
  );
} 