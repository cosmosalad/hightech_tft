// TFTUtilities.js
import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Wrench, FileSpreadsheet, Edit3 } from 'lucide-react';
import ExcelWorksheetSplitterUI from './utils/ExcelWorksheetSplitterUI';
import FileRenamerUI from './utils/FileRenamerUI';

const TFTUtilities = ({ isOpen, onClose }) => {
  const [hoveredUtility, setHoveredUtility] = useState(null);
  const [showExcelSplitter, setShowExcelSplitter] = useState(false);
  const [showFileRenamer, setShowFileRenamer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const utilities = [
    {
      id: 'excel-worksheet-splitter',
      title: '엑셀 워크시트 분할기',
      subtitle: '워크시트 분리 도구',
      description: '하나의 엑셀 파일에서 각 워크시트를 개별 파일로 분할하는 도구',
      icon: <FileSpreadsheet className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: () => setShowExcelSplitter(true)
    },
    {
      id: 'file-renamer',
      title: '파일명 일괄 변경',
      subtitle: '파일 이름 수정 도구',
      description: '여러 파일의 이름을 한 번에 변경하고 접두사/접미사를 추가하는 도구',
      icon: <Edit3 className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      onClick: () => setShowFileRenamer(true)
    }
    // 나중에 추가할 유틸리티들을 위한 공간
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wrench className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">TFT 유틸리티 도구</h2>
                <p className="text-indigo-100 mt-1">TFT 분석을 위한 추가 도구들</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* 유틸리티 그리드 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilities.map((utility) => (
              <div
                key={utility.id}
                className={`group relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${utility.bgColor} ${utility.borderColor} border-2 rounded-xl p-6 hover:shadow-xl`}
                onClick={utility.onClick}
                onMouseEnter={() => setHoveredUtility(utility.id)}
                onMouseLeave={() => setHoveredUtility(null)}
              >
                {/* 아이콘과 그라디언트 배경 */}
                <div className={`w-16 h-16 bg-gradient-to-br ${utility.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className="text-white">
                    {utility.icon}
                  </div>
                </div>
                
                {/* 제목 */}
                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-gray-900 transition-colors">
                  {utility.title}
                </h3>
                
                {/* 부제목 */}
                <p className="text-sm font-medium text-gray-600 mb-3">
                  {utility.subtitle}
                </p>
                
                {/* 설명 */}
                <p className="text-xs text-gray-500 leading-relaxed">
                  {utility.description}
                </p>
                
                {/* 호버 효과 */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${utility.color} rounded-xl pointer-events-none`}>
                  <div className="absolute inset-0 bg-white/90 rounded-xl"></div>
                </div>
                
                {/* 활성화 인디케이터 */}
                {hoveredUtility === utility.id && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                )}
              </div>
            ))}
            
            {/* 더 많은 도구 추가 예정 카드 */}
            <div className="group relative border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-300 transition-colors">
                <div className="text-gray-400">
                  <HelpCircle className="w-8 h-8" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-600 mb-1">
                더 많은 도구
              </h3>
              
              <p className="text-sm font-medium text-gray-500 mb-3">
                추가 예정
              </p>
              
              <p className="text-xs text-gray-400 leading-relaxed">
                TFT 분석을 위한 추가 유틸리티 도구들이 곧 추가될 예정입니다
              </p>
            </div>
          </div>
          
          {/* 하단 정보 */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
                유틸리티 사용 안내
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                각 도구를 클릭하여 TFT 분석 작업을 보다 효율적으로 수행하세요
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3 rounded-lg border">
                  <div className="font-semibold text-green-700 mb-1">📊 데이터 처리</div>
                  <div className="text-gray-600">엑셀 워크시트 분할, 파일명 변경 등</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="font-semibold text-blue-700 mb-1">🔧 분석 도구</div>
                  <div className="text-gray-600">계산기, 분석기 등 (추가 예정)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 엑셀 워크시트 분할기 모달 */}
      {showExcelSplitter && (
        <ExcelWorksheetSplitterUI
          isOpen={showExcelSplitter}
          onClose={() => setShowExcelSplitter(false)}
        />
      )}

      {/* 파일명 일괄 변경 모달 */}
      {showFileRenamer && (
        <FileRenamerUI
          isOpen={showFileRenamer}
          onClose={() => setShowFileRenamer(false)}
        />
      )}
    </div>
  );
};

export default TFTUtilities;