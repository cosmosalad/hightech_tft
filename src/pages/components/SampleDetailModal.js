// C:\Users\HYUN\hightech_tft\src\pages\components\SampleDetailModal.js

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 개별 샘플 상세 모달 컴포넌트
const SampleDetailModal = ({
  isOpen,
  onClose,
  sampleName,
  analysisResults,
  measurementType = 'IDVG-Linear'
}) => {
  const [showIG, setShowIG] = useState(true);
  const [showLogScale, setShowLogScale] = useState(true);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !sampleName || !analysisResults) return null;

  // measurementType에 따라 정확한 데이터 선택
  const primaryData = analysisResults[measurementType]?.find(r => r.displayName === sampleName);

  if (!primaryData) return null;

  // 통합 차트 데이터 생성 (ID, gm, IG를 하나의 그래프에)
  const createCombinedData = () => {
    if (!primaryData.chartData) return [];

    return primaryData.chartData.map(point => {
      const gmPoint = primaryData.gmData?.find(d => Math.abs(d.VG - point.VG) < 0.01);

      return {
        VG: point.VG,
        ID: point.ID,
        gm: gmPoint?.gm || null,
        IG: point.IG || null
      };
    });
  };

  const combinedData = createCombinedData();

  // 커스텀 Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-gray-400 rounded-lg shadow-xl min-w-[200px]">
          <p className="font-bold text-gray-800 mb-2 text-center border-b pb-2">
            VG: {typeof label === 'number' ? label.toFixed(3) : label} V
          </p>
          <div className="space-y-1">
            {payload.map((entry, index) => {
              if (entry.value === null || entry.value === undefined) return null;

              let unit = '';
              let color = entry.color;
              let name = entry.dataKey;

              if (entry.dataKey === 'ID') {
                unit = 'A';
                name = 'ID (Drain Current)';
              } else if (entry.dataKey === 'gm') {
                unit = 'S';
                name = 'gm (Transconductance)';
              } else if (entry.dataKey === 'IG') {
                unit = 'A';
                name = 'IG (Gate Current)';
              }

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium text-gray-700">{name}:</span>
                  </div>
                  <span className="text-sm font-mono text-gray-900 ml-2">
                    {entry.value.toExponential(2)} {unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: `${window.scrollY}px`,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{sampleName} 그래프</h2>
            <p className="text-sm text-gray-600 mt-1">ID (파랑), gm (빨강), IG (검정)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="닫기"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 모달 내용 (스크롤 관련 클래스 제거) */}
        <div className="p-6">
          {/* 컨트롤 버튼들 */}
          <div className="flex items-center justify-end mb-6 space-x-6">
            {/* IG 표시 토글 */}
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium transition-colors duration-300 ${!showIG ? 'text-gray-900' : 'text-gray-400'}`}>
                ID + gm만
              </span>
              <button
                onClick={() => setShowIG(!showIG)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  showIG ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gray-300'
                }`}
                title="IG (Gate Current) 표시/숨김"
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  showIG ? 'translate-x-9' : 'translate-x-1'
                }`}>
                  <div className="flex items-center justify-center h-full">
                    {showIG ? <span className="text-xs text-red-600 font-bold">IG</span> : <span className="text-xs text-gray-600 font-bold">ID</span>}
                  </div>
                </span>
              </button>
              <span className={`text-sm font-medium transition-colors duration-300 ${showIG ? 'text-gray-900' : 'text-gray-400'}`}>
                ID + gm + IG
              </span>
            </div>

            {/* 로그 스케일 토글 */}
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium transition-colors duration-300 ${!showLogScale ? 'text-gray-900' : 'text-gray-400'}`}>
                실제값
              </span>
              <button
                onClick={() => setShowLogScale(!showLogScale)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showLogScale ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  showLogScale ? 'translate-x-9' : 'translate-x-1'
                }`}>
                  <div className="flex items-center justify-center h-full">
                    {showLogScale ? <span className="text-xs text-blue-600 font-bold">log</span> : <span className="text-xs text-gray-600 font-bold">lin</span>}
                  </div>
                </span>
              </button>
              <span className={`text-sm font-medium transition-colors duration-300 ${showLogScale ? 'text-gray-900' : 'text-gray-400'}`}>
                로그값
              </span>
            </div>
          </div>

          {/* 통합 그래프 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">통합 전기적 특성 그래프</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} margin={{ left: 20, right: 50, top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="VG"
                    label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }}
                  />
                  {/* 왼쪽 Y축 - ID, IG용 */}
                  <YAxis
                    yAxisId="left"
                    scale={showLogScale ? "log" : "linear"}
                    domain={showLogScale ? [1e-12, 1e-3] : ['auto', 'auto']}
                    label={{ value: 'ID (A)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => showLogScale ? value.toExponential(0) : value.toExponential(2)}
                  />
                  {/* 오른쪽 Y축 - gm용 */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    scale="linear"
                    domain={['auto', 'auto']}
                    label={{ 
                      value: 'gm (S)', 
                      angle: 90, 
                      position: 'insideRight',
                      style: { textAnchor: 'middle' },
                      dx: 20
                    }}
                    tickFormatter={(value) => value.toExponential(1)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '15px' }} />

                  {/* ID 라인 - 파랑색, 왼쪽 축 */}
                  <Line
                    type="monotone"
                    dataKey="ID"
                    yAxisId="left"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={false}
                    name="ID (Drain Current)"
                    connectNulls={false}
                  />

                  {/* gm 라인 - 빨간색, 오른쪽 축 */}
                  <Line
                    type="monotone"
                    dataKey="gm"
                    yAxisId="right"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={false}
                    name="gm (Transconductance)"
                    connectNulls={false}
                  />

                  {/* IG 라인 - 검정색, 왼쪽 축 (조건부 표시) */}
                  {showIG && (
                    <Line
                      type="monotone"
                      dataKey="IG"
                      yAxisId="left"
                      stroke="#1F2937"
                      strokeWidth={2}
                      dot={false}
                      name="IG (Gate Current)"
                      connectNulls={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleDetailModal;