// src/pages/components/DualAxisIDVGChart.js
//
// ⭐️ 요청사항 반영 수정본 (v4) ⭐️
// - 사용자가 제공한 원본 파일 구조(prop, 닫기 버튼 등)를 기반으로 수정
// - 1. X축: VG - Vth
// - 2. Y축 (왼쪽): ID (Log Scale)
// - 3. Y축 (오른쪽): Mobility (Linear Scale)
// - 4. 데이터 필터링: 원본 VG 값 기준 -5V ~ 10V 영역만 표시
// - 5. [수정] V3의 에러 원인(result.data)을 result.chartData로 수정

import React, { useState, useMemo } from 'react'; // ⭐️ useMemo 추가
import { X } from 'lucide-react'; // ⭐️ Eye, EyeOff 제거 (접선/IG 토글 제거)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SampleNameTooltip } from './ChartComponents'; // ⭐️ 기존 Tooltip 컴포넌트 import

// 🌟 황금비 기반 색상 생성 함수들 (원본 유지)
const generateGoldenRatioColor = (index) => {
  const goldenAngle = 137.508;
  const hue = (index * goldenAngle) % 360;
  const saturation = 65 + (index % 4) * 5;
  const lightness = 45 + (index % 3) * 8;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// ⭐️ [신규] Mobility 라인 색상 생성기 (ID와 색상 구분 위함)
const generateMobilityColor = (index) => {
  const goldenAngle = 137.508;
  const hue = ((index * goldenAngle) + 45) % 360; // ⭐️ 색상 Hue 쉬프트
  const saturation = 70 + (index % 3) * 5;
  const lightness = 60 + (index % 2) * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// ⭐️ (참고) 원본 파일의 다른 색상 함수들 (현재 미사용)
const generateIGColor = (index) => {
  // ... (원본 코드)
};
const generateTangentColor = (index) => {
  // ... (원본 코드)
};
const generateReferenceColor = (index, offset = 0) => {
  // ... (원본 코드)
};


// ⭐️ [수정] 차트 컴포넌트 구현부를 요청사항에 맞게 전체 교체
export const DualAxisIDVGChart = ({ resultArray, type, sortByValue, formatLinearCurrent, onClose }) => {
  
  // ⭐️ [신규] 새 차트에 맞는 상태
  const [hiddenSeries, setHiddenSeries] = useState([]);
  // ⭐️ (참고) 부모의 sortByValue 대신 자체 정렬 상태 사용 (sortByValue prop은 현재 미사용)
  const [localSortByValue, setLocalSortByValue] = useState(false); 
  
  // ⭐️ [신규] useMemo를 사용한 데이터 가공 (요청사항 1, 4 적용)
  const { combinedData, minX, maxX } = useMemo(() => {
    const allDataMap = new Map();
    let minXVal = Infinity;
    let maxXVal = -Infinity;
    
    // ⭐️ result.chartData가 없을 경우를 대비해 기본값 처리
    if (!resultArray) return { combinedData: [], minX: -10, maxX: 10 }; 

    resultArray.forEach((result, index) => {
      const key = result.displayName || `File${index + 1}`;
      // ⭐️ 1. Vth 값 가져오기
      const vth = result.parameters.Vth?.value || 0; 
      
      // ⭐️ [수정] V3 에러 수정: result.data -> result.chartData
      const dataArray = result.chartData || []; 
      
      // ⭐️ 4. 데이터 필터링: 원본 VG 값 기준 -5V ~ 10V
      const filteredData = dataArray.filter(p => p.VG >= -5 && p.VG <= 10);

      filteredData.forEach(point => {
        // ⭐️ 1. X축: VG - Vth
        const xValue = point.VG - vth; 
        minXVal = Math.min(minXVal, xValue);
        maxXVal = Math.max(maxXVal, xValue);

        let dataPoint = allDataMap.get(xValue);
        if (!dataPoint) {
          dataPoint = { VG_minus_Vth: xValue };
          allDataMap.set(xValue, dataPoint);
        }
        
        // ⭐️ 2. Y-left: ID
        dataPoint[`${key}_ID`] = Math.abs(point.ID);
        
        // ⭐️ 3. Y-right: Mobility (키: 'point.Mobility_FE' 가정)
        if (point.Mobility_FE !== undefined) {
          dataPoint[`${key}_Mobility_FE`] = point.Mobility_FE;
        }
      });
    });

    const sortedData = Array.from(allDataMap.values()).sort((a, b) => a.VG_minus_Vth - b.VG_minus_Vth);
    const finalMinX = minXVal === Infinity ? -10 : minXVal;
    const finalMaxX = maxXVal === -Infinity ? 10 : maxXVal;

    return { combinedData: sortedData, minX: finalMinX, maxX: finalMaxX };
  }, [resultArray]);

  // ⭐️ [신규] X축 눈금 자동 계산
  const dynamicTicks = useMemo(() => {
    if (minX === Infinity || maxX === -Infinity) return [];
    const range = maxX - minX;
    if (range === 0) return [minX];
    let step = 5; 
    if (range <= 10) step = 2;
    if (range <= 5) step = 1;
    if (range > 20) step = Math.ceil(range / 5 / 2.5) * 2.5; 
    const ticks = [];
    const start = Math.floor(minX / step) * step;
    for (let i = start; i <= maxX; i += step) {
      ticks.push(parseFloat(i.toFixed(2)));
    }
    if (!ticks.includes(maxX) && ticks[ticks.length - 1] < maxX) {
        ticks.push(parseFloat(maxX.toFixed(2)));
    }
    return ticks;
  }, [minX, maxX]);

  // ⭐️ [신규] 범례 클릭 핸들러
  const handleLegendClick = (e) => {
    const { dataKey } = e; 
    setHiddenSeries(prev => 
      prev.includes(dataKey) 
        ? prev.filter(s => s !== dataKey) 
        : [...prev, dataKey]
    );
  };
  
  // ⭐️ [수정] 원본의 렌더링 로직을 새 차트 로직으로 교체
  return (
    <div className="w-full relative">
      {/* --- 모달 상단 헤더 (원본 구조 유지) --- */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">ID-Mobility vs (VG-Vth)</h3>
        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800">
          <X size={24} />
        </button>
      </div>

      {/* --- 토글 버튼들 (원본 구조 유지, 단순화) --- */}
      <div className="flex items-center justify-end mb-4 flex-wrap gap-6">
        {/* ⭐️ [신규] 툴팁 정렬 버튼 */}
        <button
          onClick={() => setLocalSortByValue(prev => !prev)}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          툴팁 값으로 정렬: {localSortByValue ? 'ON' : 'OFF'}
        </button>
        
        {/* ⭐️ [제거] IG 토글, 접선 토글 버튼 제거 */}
        
        {/* ⭐️ [유지] 기본 뷰 돌아가기 버튼 (원본) */}
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

      {/* --- [신규] 요청사항 1, 2, 3이 적용된 이중 축 차트 --- */}
      <h4 className="text-lg font-semibold mb-2 text-center">ID (Log) & Mobility (Linear)</h4>
      <div className="h-96"> {/* ⭐️ 차트 높이 */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            
            {/* ⭐️ 1. X축: VG - Vth */}
            <XAxis 
               dataKey="VG_minus_Vth" 
               label={{ value: 'VG - Vth (V)', position: 'insideBottom', offset: -10 }} 
               domain={[minX, maxX]}
               ticks={dynamicTicks}
               type="number"
               allowDataOverflow={true}
            />
            
            {/* ⭐️ 2. Y축 (왼쪽): ID (Log Scale) */}
            <YAxis 
               yAxisId="left"
               scale="log" 
               domain={[1e-12, 1e-3]} 
               label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', dx: -10 }} 
               tickFormatter={(value) => value.toExponential(0)}
               name="ID"
               allowDataOverflow={true}
            />
            
            {/* ⭐️ 3. Y축 (오른쪽): Mobility (Linear Scale) */}
            <YAxis 
               yAxisId="right"
               orientation="right"
               scale="linear"
               domain={['auto', 'auto']} // 자동 스케일
               label={{ value: 'Mobility (cm²/Vs)', angle: 90, position: 'insideRight', dx: 10 }} 
               name="Mobility"
               // ⭐️ Mobility 값이 null/undefined일 경우 틱에 빈 문자열 표시
               tickFormatter={(value) => value ? value.toExponential(1) : ''} 
            />

            {/* ⭐️ 툴팁 (x축 라벨, 정렬 기능 수정) */}
            <Tooltip content={<SampleNameTooltip xAxisLabel="VG - Vth" yAxisUnit="A" sortByValue={localSortByValue} showLogScale={true} />} />
            
            {/* ⭐️ 범례 */}
            <Legend wrapperStyle={{ paddingTop: '20px' }} onClick={handleLegendClick} iconType="line" />
            
            {/* ⭐️ (VG - Vth) = 0 기준선 */}
            <ReferenceLine x={0} stroke="rgba(0, 0, 0, 0.5)" strokeDasharray="3 3" />

            {/* ⭐️ [신규] ID 및 Mobility 라인 렌더링 */}
            {resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              return (
                <React.Fragment key={`fragment-${index}`}>
                  {/* ID Line (Left Axis) */}
                  <Line 
                    key={`id-${index}`} 
                    yAxisId="left"
                    type="monotone" 
                    dataKey={`${key}_ID`} 
                    stroke={generateGoldenRatioColor(index)} 
                    strokeWidth={2} 
                    dot={false} 
                    name={`${key} - ID`}
                    hide={hiddenSeries.includes(`${key} - ID`)} 
                    connectNulls={false} // ⭐️ null 값 연결 방지
                  />
                  {/* Mobility Line (Right Axis) */}
                  <Line 
                    key={`mobility-${index}`} 
                    yAxisId="right"
                    type="monotone" 
                    dataKey={`${key}_Mobility_FE`} 
                    stroke={generateMobilityColor(index)} // ⭐️ 다른 색상 함수
                    strokeDasharray="5 5" // ⭐️ 점선
                    strokeWidth={2} 
                    dot={false} 
                    name={`${key} - Mobility`}
                    hide={hiddenSeries.includes(`${key} - Mobility`)} 
                    connectNulls={false} // ⭐️ null 값 연결 방지
                  />
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* --- [제거] 원본의 Log/Linear/IG 개별 차트 로직 제거 --- */}

    </div>
  );
};