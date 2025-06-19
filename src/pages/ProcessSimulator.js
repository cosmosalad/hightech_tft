import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import TFTProcessSimulator from '../simulator/TFTProcessSimulator'; // 실제 시뮬레이터 로직을 담은 컴포넌트를 import합니다.

/**
 * ProcessSimulator 페이지 컴포넌트입니다.
 * 전체적인 페이지 레이아웃과 상단 네비게이션을 담당하며,
 * 실제 시뮬레이터 내용은 TFTProcessSimulator 컴포넌트를 렌더링하여 표시합니다.
 * @param {object} props - onNavigateHome, onNavigateBack 함수를 포함합니다.
 */
const ProcessSimulator = ({ onNavigateHome, onNavigateBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 네비게이션 헤더 */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateBack}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                소개로 돌아가기
              </button>
              
              <button
                onClick={onNavigateHome}
                className="flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                홈으로
              </button>
            </div>
            
            <div className="text-sm font-semibold text-gray-700">
              TFT Process Simulator
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠: 실제 시뮬레이터 컴포넌트를 렌더링합니다. */}
      <div className="max-w-6xl mx-auto">
        <TFTProcessSimulator />
      </div>
    </div>
  );
};

export default ProcessSimulator;