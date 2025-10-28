// src/pages/components/DualAxisIDVGChart.js

import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react'; // ⭐️ X (닫기) 아이콘 추가
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SampleNameTooltip } from './ChartComponents'; // ⭐️ 기존 Tooltip 컴포넌트 import

// 🌟 황금비 기반 색상 생성 함수들 (ChartComponents.js에서 복사)
const generateGoldenRatioColor = (index) => {
  const goldenAngle = 137.508;
  const hue = (index * goldenAngle) % 360;
  const saturation = 65 + (index % 4) * 5;
  const lightness = 45 + (index % 3) * 8;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const generateIGColor = (index) => {
  const goldenAngle = 137.508;
  const hue = (index * goldenAngle) % 360;
  const saturation = 70 + (index % 3) * 5;
  const lightness = 60 + (index % 2) * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const generateTangentColor = (index) => {
  const goldenAngle = 137.508;
  const hue = ((index * goldenAngle) + 20) % 360;
  const saturation = 75 + (index % 3) * 5;
  const lightness = 40 + (index % 2) * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const generateReferenceColor = (index, offset = 0) => {
  const goldenAngle = 137.508;
  const hue = ((index * goldenAngle) + offset) % 360;
  const saturation = 60 + (index % 2) * 10;
  const lightness = 35 + (index % 2) * 5;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};


// ⭐️ Log/Linear 분리형 IDVG 차트 컴포넌트
export const DualAxisIDVGChart = ({ resultArray, type, sortByValue, formatLinearCurrent, onClose }) => {
  const [showIG, setShowIG] = useState(false);
  const [showVthTangent, setShowVthTangent] = useState(false);
  const [hiddenLines, setHiddenLines] = useState(new Set());
  
  // 범례 클릭 핸들러
  const handleLegendClick = (data) => {
    const { dataKey } = data;
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) newSet.delete(dataKey);
      else newSet.add(dataKey);
      
      const baseKey = dataKey.replace('_IG', '').replace('_tangent', '');
      if (newSet.has(dataKey)) {
        newSet.add(`${baseKey}_IG`);
        newSet.add(`${baseKey}_tangent`);
      } else {
        newSet.delete(`${baseKey}_IG`);
        newSet.delete(`${baseKey}_tangent`);
      }
      return newSet;
    });
  };

  // Vth 접선 계산 (기존 로직 동일)
  const calculateVthTangentInfo = (chartData, parameters) => {
      if (!chartData || !parameters || type !== 'IDVG-Linear') return null;
      const vthStr = parameters.Vth;
      const gmMaxStr = parameters.gm_max;
      if (!vthStr || !gmMaxStr) return null;
      const vth = parseFloat(vthStr.split(' ')[0]);
      const gmMax = parseFloat(gmMaxStr.split(' ')[0]);
      if (isNaN(vth) || isNaN(gmMax)) return null;

      const vth_offset = -0.1;

      let gmMaxVG = vth + 2;
      const gmMaxPoint = chartData.find(d => Math.abs(d.VG - gmMaxVG) < 0.5);
      if (gmMaxPoint) {
        gmMaxVG = gmMaxPoint.VG;
      } else {
        const candidatePoints = chartData.filter(d => d.VG >= vth + 1 && d.VG <= vth + 3);
        if (candidatePoints.length > 0) {
          const selectedPoint = candidatePoints[Math.floor(candidatePoints.length / 2)];
          gmMaxVG = selectedPoint.VG;
        }
      }
      const vgMin = Math.min(...chartData.map(d => d.VG));
      const vgMax = Math.max(...chartData.map(d => d.VG));
      const tangentData = [];
      for (let vg = vgMin; vg <= vgMax; vg += 0.1) {
        const idTangent = gmMax * (vg - (vth + vth_offset));
        tangentData.push({ VG: parseFloat(vg.toFixed(1)), ID_tangent: idTangent > 0 ? idTangent : null });
      }
      return { vth, gmMax, gmMaxVG, tangentData };
  };

  // 데이터 구성 (기존 로직 동일)
  const allVGValues = [...new Set(resultArray.flatMap(result => result.chartData ? result.chartData.map(d => d.VG) : []))].sort((a, b) => a - b);
  if (allVGValues.length === 0) return null;

  const minVG = Math.floor(allVGValues[0]);
  const maxVG = Math.ceil(allVGValues[allVGValues.length - 1]);
  const dynamicTicks = [];
  for (let i = minVG; i <= maxVG; i += 3) {
    dynamicTicks.push(i);
  }

  const combinedData = allVGValues.map(vg => {
    const dataPoint = { VG: vg };
    resultArray.forEach((result, index) => {
      if (result.chartData) {
        const point = result.chartData.find(d => Math.abs(d.VG - vg) < 0.01);
        const key = result.displayName || `File${index + 1}`;
        dataPoint[key] = point?.ID || null;
        dataPoint[`${key}_IG`] = point?.IG || null;
        if (showVthTangent && type === 'IDVG-Linear') {
          const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
          if (tangentInfo) {
            const tangentPoint = tangentInfo.tangentData.find(d => Math.abs(d.VG - vg) < 0.05);
            dataPoint[`${key}_tangent`] = tangentPoint?.ID_tangent || null;
          }
        }
      }
    });
    return dataPoint;
  });

  // 커스텀 범례 (기존 로직 동일)
  const renderCustomLegend = ({ payload, onClick }) => (
    <div style={{ textAlign: 'center', paddingTop: '10px' }}>
      {payload.map((entry, index) => {
        if (entry.dataKey && (entry.dataKey.includes('_tangent') || entry.dataKey.includes('_IG'))) {
          return null;
        }
        return (
          <span key={`item-${index}`} onClick={() => onClick(entry)} style={{ margin: '0 10px', cursor: 'pointer', color: entry.inactive ? '#ccc' : entry.color }}>
            <svg width="14" height="14" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}><line x1="0" y1="7" x2="14" y2="7" stroke={entry.color} strokeWidth="2" /></svg>
            {entry.value}
          </span>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* --- 모달 상단 헤더 --- */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">ID-VG 분리 뷰 (Log/Linear)</h3>
        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800">
          <X size={24} />
        </button>
      </div>

      {/* --- 토글 버튼들 --- */}
      <div className="flex items-center justify-end mb-4 flex-wrap gap-6">
        <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium transition-colors duration-300 ${!showIG ? 'text-gray-900' : 'text-gray-400'}`}>ID만 표시</span>
            <button onClick={() => setShowIG(!showIG)} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${showIG ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gray-300'}`} title="IG (Gate Current) 표시/숨김">
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${showIG ? 'translate-x-9' : 'translate-x-1'}`}>
                    <div className="flex items-center justify-center h-full">{showIG ? <span className="text-xs text-red-600 font-bold">IG</span> : <span className="text-xs text-gray-600 font-bold">ID</span>}</div>
                </span>
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${showIG ? 'text-gray-900' : 'text-gray-400'}`}>ID + IG 표시</span>
        </div>
          
        {type === 'IDVG-Linear' && (
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium transition-colors duration-300 ${!showVthTangent ? 'text-gray-900' : 'text-gray-400'}`}>접선 숨김</span>
            <button onClick={() => setShowVthTangent(!showVthTangent)} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${showVthTangent ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-300'}`} title="Vth 계산용 접선 표시/숨김">
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${showVthTangent ? 'translate-x-9' : 'translate-x-1'}`}>
                <div className="flex items-center justify-center h-full">{showVthTangent ? <Eye className="w-3 h-3 text-orange-600" /> : <EyeOff className="w-3 h-3 text-gray-600" />}</div>
              </span>
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${showVthTangent ? 'text-gray-900' : 'text-gray-400'}`}>접선 표시</span>
          </div>
        )}
        
        {/* ⭐️ [추가] 기본 뷰 돌아가기 버튼 ⭐️ */}
        <div className="flex items-center">
          <button 
            onClick={onClose} 
            className="px-3 py-1 rounded text-sm transition-colors bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
            title="기본 뷰로 돌아가기"
          >
            기본 뷰로
          </button>
        </div>
      </div>

      {/* --- 1. Log Scale 차트 --- */}
      <h4 className="text-lg font-semibold mb-2 text-center">ID-VG (Log Scale)</h4>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ left: 18 }} syncId="dualChartSync">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="VG" 
              label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
              domain={[minVG, maxVG]}
              ticks={dynamicTicks}
            />
            <YAxis 
              scale="log" 
              domain={[1e-12, 1e-3]} 
              label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }} 
              tickFormatter={(value) => value.toExponential(0)} 
            />
            <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} showLogScale={true} formatLinearCurrent={formatLinearCurrent} />} />
            {resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              return <Line key={index} type="monotone" dataKey={key} stroke={generateGoldenRatioColor(index)} strokeWidth={2} dot={false} name={key} connectNulls={false} hide={hiddenLines.has(key)} />;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --- 2. Linear Scale 차트 --- */}
      <h4 className="text-lg font-semibold mt-8 mb-2 text-center">ID-VG (Linear Scale)</h4>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ left: 18 }} syncId="dualChartSync">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="VG" 
              label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
              domain={[minVG, maxVG]}
              ticks={dynamicTicks}
            />
            <YAxis 
              scale="linear" 
              domain={['auto', 'auto']} 
              label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }} 
              tickFormatter={(value) => formatLinearCurrent(value)} 
            />
            <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} showLogScale={false} formatLinearCurrent={formatLinearCurrent} />} />
            
            <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" content={renderCustomLegend} />
            
            {resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              return <Line key={index} type="monotone" dataKey={key} stroke={generateGoldenRatioColor(index)} strokeWidth={2} dot={false} name={key} connectNulls={false} hide={hiddenLines.has(key)} />;
            })}
            {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
              if (!tangentInfo) return null;
              return <Line key={`tangent-${index}`} type="monotone" dataKey={`${key}_tangent`} stroke={generateTangentColor(index)} strokeWidth={2} strokeDasharray="8 4" dot={false} legendType="none" connectNulls={false} hide={hiddenLines.has(key)} />;
            })}
            {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
                const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
                if (!tangentInfo) return null;
                return (
                  <React.Fragment key={`ref-${index}`}>
                    <ReferenceLine x={tangentInfo.gmMaxVG} stroke={generateReferenceColor(index, 0)} strokeDasharray="4 4" strokeWidth={1} label={{ value: `gm_max VG`, position: "topLeft", style: { fontSize: '10px' } }} />
                    <ReferenceLine x={tangentInfo.vth} stroke={generateReferenceColor(index, 60)} strokeDasharray="4 4" strokeWidth={2} label={{ value: `Vth=${tangentInfo.vth.toFixed(2)}V`, position: "bottomRight", style: { fontSize: '11px', fontWeight: 'bold' } }} />
                    <ReferenceLine x={tangentInfo.vth} y={0} stroke="transparent" dot={{ fill: generateReferenceColor(index, 60), stroke: generateReferenceColor(index, 90), strokeWidth: 2, r: 6 }} />
                  </React.Fragment>
                );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

     {/* --- 3. IG 차트 (기존 로직 동일) --- */}
     <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showIG ? 'max-h-[500px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
       <h4 className="text-lg font-semibold mb-4">IG-VG (Gate Current) 그래프</h4>
       <div className="h-80">
         <ResponsiveContainer width="100%" height="100%">
           <LineChart data={combinedData} margin={{ left: 18 }} syncId="dualChartSync">
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis 
                dataKey="VG" 
                label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
                domain={[minVG, maxVG]}
                ticks={dynamicTicks}
             />
             <YAxis scale="log" domain={[1e-12, 1e-6]} label={{ value: 'IG (A)', angle: -90, position: 'insideLeft', dx: -10 }} tickFormatter={(value) => value.toExponential(0)} />
             <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} showLogScale={true} />} />
             <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" />
             {resultArray.map((result, index) => {
               const key = result.displayName || `File${index + 1}`;
               return (
                 <Line key={`ig-${index}`} type="monotone" dataKey={`${key}_IG`} stroke={generateIGColor(index)} strokeWidth={2} dot={false} name={`${key} - IG`} connectNulls={false} hide={hiddenLines.has(`${key}_IG`)} />
               );
             })}
           </LineChart>
         </ResponsiveContainer>
       </div>
     </div>
   </div>
 );
};