import React from 'react';
import { useToast } from '../../contexts/ToastContext';

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-24 inset-x-0 flex flex-col items-center z-[9999] pointer-events-none space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up pointer-events-auto max-w-xs w-full mx-auto"
        >
          <div className="font-semibold truncate">{t.title}</div>
          {t.body && <div className="text-sm opacity-80 truncate">{t.body}</div>}
        </div>
      ))}
      <style jsx>{`
        @keyframes slide-up {
          from {transform: translateY(50%); opacity: 0;}
          to {transform: translateY(0); opacity: 1;}
        }
        .animate-slide-up {animation: slide-up 0.3s ease-out;}
      `}</style>
    </div>
  );
} 