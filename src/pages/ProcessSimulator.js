import React from 'react';
import { ArrowLeft } from 'lucide-react';
import TFTProcessSimulator from '../simulator/TFTProcessSimulator';

const ProcessSimulatorPage = ({ onNavigateHome, onNavigateBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </button>
        </div>
      </div>
      
      {/* 시뮬레이터 컴포넌트 */}
      <TFTProcessSimulator />
    </div>
  );
};

export default ProcessSimulatorPage;