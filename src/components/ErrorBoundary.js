import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Firebase 권한 에러는 무시 (이미 적절한 fallback이 있음)
    if (error.message && error.message.includes('Missing or insufficient permissions')) {
      console.warn('Firebase 권한 에러가 발생했지만 앱은 계속 실행됩니다:', error.message);
      this.setState({ hasError: false, error: null });
      return;
    }

    // YouTube API 에러도 무시
    if (error.message && (error.message.includes('YouTube') || error.message.includes('video'))) {
      console.warn('YouTube 관련 에러가 발생했지만 앱은 계속 실행됩니다:', error.message);
      this.setState({ hasError: false, error: null });
      return;
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              일시적인 오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 