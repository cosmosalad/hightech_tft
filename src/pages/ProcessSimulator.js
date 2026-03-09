import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import TFTProcessSimulator from '../simulator/TFTProcessSimulator';

const ProcessSimulator = ({ onNavigateHome, onNavigateBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {}
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
      {}
      <div className="max-w-6xl mx-auto">
        <TFTProcessSimulator />
      </div>
    </div>
  );
};

export default ProcessSimulator;