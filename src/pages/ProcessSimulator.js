import React from 'react';
import { ArrowLeft, Home, Activity } from 'lucide-react';
import TFTProcessSimulator from '../simulator/TFTProcessSimulator';

const ProcessSimulator = ({ onNavigateHome, onNavigateBack }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-100 flex flex-col">
      {/* 상단 네비게이션 */}
      <div className="bg-slate-900/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-cyan-900/50 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateBack}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors border border-cyan-900/50 text-sm font-mono tracking-widest"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                RETURN
              </button>
              
              <button
                onClick={onNavigateHome}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors border border-cyan-900/50 text-sm font-mono tracking-widest"
              >
                <Home className="w-4 h-4 mr-2" />
                SYSTEM_HOME
              </button>
            </div>
            
            <div className="flex items-center space-x-3 text-sm font-bold text-white tracking-widest uppercase font-mono">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span>TFT Process Simulator</span>
            </div>
          </div>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-cyan-900 via-cyan-400 to-purple-900 opacity-50"></div>
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 w-full relative">
        <TFTProcessSimulator />
      </div>
    </div>
  );
};

export default ProcessSimulator;