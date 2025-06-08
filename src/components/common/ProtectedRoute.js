import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // 임시로 모든 라우트 접근 허용 (Google OAuth 제거됨)
  console.log('🔄 임시 모드: 모든 라우트 접근 허용');
  return children;
} 