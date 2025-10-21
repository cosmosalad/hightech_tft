// C:\Users\HYUN\hightech_tft\src\pages\components\ChartComponents.js

// 👈 1. useMemo 추가
import React, { useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// 🌟 황금비 기반 색상 생성 함수들
const generateGoldenRatioColor = (index) => {
  const goldenAngle = 137.508; // 황금각
  const hue = (index * goldenAngle) % 360;
  const saturation = 65 + (index % 4) * 5; // 65%, 70%, 75%, 80% 순환
  const lightness = 45 + (index % 3) * 8;  // 45%, 53%, 61% 순환
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const generateIGColor = (index) => {
  const goldenAngle = 137.508;
  const hue = (index * goldenAngle) % 360;
  const saturation = 70 + (index % 3) * 5; // 더 높은 채도
  const lightness = 60 + (index % 2) * 10; // 더 밝게
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const generateTangentColor = (index) => {
  const goldenAngle = 137.508;
  const hue = ((index * goldenAngle) + 20) % 360; // +20도 오프셋
  const saturation = 75 + (index % 3) * 5;
  const lightness = 40 + (index % 2) * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const generateGmColor = (index) => {
  return generateGoldenRatioColor(index);
};

const generateReferenceColor = (index, offset = 0) => {
  const goldenAngle = 137.508;
  const hue = ((index * goldenAngle) + offset) % 360;
  const saturation = 60 + (index % 2) * 10;
  const lightness = 35 + (index % 2) * 5;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Tooltip 컴포넌트 (변경 없음)
export const SampleNameTooltip = ({ active, payload, label, xAxisLabel, yAxisUnit, sortByValue, showLogScale, formatLinearCurrent }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border-2 border-gray-400 rounded-lg shadow-xl min-w-[250px]" style={{ backgroundColor: '#ffffff', opacity: 1, zIndex: 9999 }}>
        <p className="font-bold text-gray-800 mb-3 text-center border-b pb-2">
          {xAxisLabel}: {typeof label === 'number' ? label.toFixed(3) : label} V
        </p>
        <div className="space-y-2">
          {(sortByValue ?
            [...payload].sort((a, b) => (b.value || 0) - (a.value || 0)) :
            payload
          ).map((entry, index) => {
            if (entry.value === null || entry.value === undefined) return null;
            if (entry.dataKey && entry.dataKey.includes('_tangent')) return null;

            let sampleName = entry.dataKey;
            let measurementInfo = '';

            if (entry.dataKey.includes('_gm')) {
              sampleName = entry.dataKey.replace('_gm', '');
              measurementInfo = ' - gm';
            } else if (entry.dataKey.includes('_IG')) {
              sampleName = entry.dataKey.replace('_IG', '');
              measurementInfo = ' - IG';
            } else if (entry.dataKey.includes('VG_')) {
              const vgMatch = entry.dataKey.match(/VG_(.+)V/);
              if (vgMatch) {
                sampleName = entry.name ? entry.name.split(' ')[0] : entry.dataKey;
                measurementInfo = ` - VG=${vgMatch[1]}V`;
              }
            } else if (entry.dataKey === 'Forward' || entry.dataKey === 'Backward') {
              sampleName = entry.name ? entry.name.replace(` ${entry.dataKey}`, '') : 'Sample';
              measurementInfo = ` - ${entry.dataKey}`;
            } else {
              const nameMatch = entry.name ? String(entry.name).match(/(.+?)\s*\((.+?)\)/) : null;
              if (nameMatch) {
                sampleName = nameMatch[1];
                measurementInfo = ` - ${nameMatch[2]}`;
              } else {
                sampleName = entry.name || entry.dataKey; 
              }
            }
            
            const value = entry.value;
            const originalValue = showLogScale ? Math.pow(10, value) : value;
            
            let displayValue;
            if (showLogScale) {
                displayValue = originalValue.toExponential(2);
            } else if (formatLinearCurrent) {
                displayValue = formatLinearCurrent(originalValue);
            } else {
                displayValue = originalValue.toExponential(2);
            }

            return (
              <div key={index} className="flex items-center justify-between p-2 rounded">
                <div className="flex items-center flex-1">
                  <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: entry.color }} />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{sampleName || 'Unknown Sample'}</div>
                    {measurementInfo && (<div className="text-xs text-gray-500">{measurementInfo}</div>)}
                  </div>
                </div>
                <div className="font-mono text-sm text-gray-900 ml-3">
                  {displayValue} {yAxisUnit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};


// IDVD 차트 컴포넌트 (변경 없음)
export const IDVDCharts = ({ resultArray, hasMultipleFiles, sortByValue }) => {
  // ... (기존 코드와 동일) ...
  const [hiddenLines, setHiddenLines] = useState(new Set());
  const handleLegendClick = (data) => {
    const { dataKey } = data;
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) newSet.delete(dataKey);
      else newSet.add(dataKey);
      return newSet;
    });
  };

  return (
    <div className="space-y-8">
      {resultArray.map((result, fileIndex) => {
        if (!result || !result.chartData) return null;
        return (
          <div key={fileIndex} className="relative">
            {hasMultipleFiles && (
              <h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">{result.displayName}</h4>
            )}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                <LineChart data={result.chartData} margin={{ top: 10, right: 20, left: 18, bottom: 10 }}>
                  <XAxis dataKey="VD" label={{ value: 'VD (V)', position: 'insideBottom', offset: -10 }} domain={[0, 'dataMax']} />
                  <YAxis scale="linear" domain={[0, 'dataMax']} label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', dx: -10 }} tickFormatter={(value) => value.toExponential(0)} />
                  <Tooltip content={<SampleNameTooltip xAxisLabel="VD" yAxisUnit="A" sortByValue={sortByValue} showLogScale={false} formatLinearCurrent={(v) => v.toExponential(2)} />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" />
                  {result.gateVoltages && result.gateVoltages.map((vg, vgIndex) => {
                    const lineKey = `VG_${vg}V`;
                    return (
                      <Line key={vg} type="monotone" dataKey={lineKey} stroke={generateGoldenRatioColor(vgIndex)} strokeWidth={2} dot={false} name={`${result.displayName} VG=${vg}V`} hide={hiddenLines.has(lineKey)} />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Hysteresis 차트 컴포넌트 (수정됨)
export const HysteresisCharts = ({ resultArray, hasMultipleFiles, sortByValue }) => {
    const [showIG, setShowIG] = useState(false);
    
    return (
    <div>
        <div className="flex items-center justify-end mb-4 space-x-6">
            <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium transition-colors duration-300 ${!showIG ? 'text-gray-900' : 'text-gray-400'}`}>ID만 표시</span>
                <button onClick={() => setShowIG(!showIG)} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${showIG ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gray-300'}`} title="IG (Gate Current) 표시/숨김">
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${showIG ? 'translate-x-9' : 'translate-x-1'}`}>
                        <div className="flex items-center justify-center h-full">{showIG ? <span className="text-xs text-red-600 font-bold">IG</span> : <span className="text-xs text-gray-600 font-bold">ID</span>}</div>
                    </span>
                </button>
                <span className={`text-sm font-medium transition-colors duration-300 ${showIG ? 'text-gray-900' : 'text-gray-400'}`}>ID + IG 표시</span>
            </div>
        </div>
        <div className="space-y-8">
            {/* 👈 2. *** BUG FIX *** : map 인자 순서 (index, result) -> (result, index)로 수정 */}
            {resultArray.map((result, index) => {
                if (!result.forwardData || !result.backwardData) return null;
                const allVGValues = [...new Set([...result.forwardData.map(d => d.VG), ...result.backwardData.map(d => d.VG)])].sort((a, b) => a - b);
                const combinedData = allVGValues.map(vg => {
                    const forwardPoint = result.forwardData.find(d => Math.abs(d.VG - vg) < 0.01);
                    const backwardPoint = result.backwardData.find(d => Math.abs(d.VG - vg) < 0.01);
                    return { VG: vg, Forward: forwardPoint?.ID || null, Backward: backwardPoint?.ID || null, Forward_IG: forwardPoint?.IG || null, Backward_IG: backwardPoint?.IG || null };
                });

                const forwardColor = generateGoldenRatioColor(index * 2);
                const backwardColor = generateGoldenRatioColor(index * 2 + 1);

                return (
                    <div key={index} className="relative">
                        {hasMultipleFiles && (<h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">{result.displayName}</h4>)}
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                                <LineChart data={combinedData} margin={{ left: 18 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="VG" label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} />
                                    <YAxis scale="log" domain={[1e-12, 1e-3]} label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', dx: -10 }} tickFormatter={(value) => value.toExponential(0)} />
                                    {/* 👈 Tooltip에 showLogScale={true} 명시 */}
                                    <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} showLogScale={true} />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" onClick={() => {}}/>
                                    <Line type="monotone" dataKey="Forward" stroke={forwardColor} name={`${result.displayName} Forward`} strokeWidth={2} dot={false} connectNulls={false} />
                                    <Line type="monotone" dataKey="Backward" stroke={backwardColor} name={`${result.displayName} Backward`} strokeWidth={2} dot={false} connectNulls={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showIG ? 'max-h-[500px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
                            <h4 className="text-lg font-semibold mb-4">IG-VG (Gate Current) - Hysteresis</h4>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={combinedData} margin={{ left: 18 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="VG" label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} />
                                        <YAxis scale="log" domain={[1e-12, 1e-6]} label={{ value: 'IG (A)', angle: -90, position: 'insideLeft', dx: -10 }} tickFormatter={(value) => value.toExponential(0)} />
                                        {/* 👈 Tooltip에 showLogScale={true} 명시 */}
                                        <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} showLogScale={true} />} />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line" onClick={() => {}}/>
                                        <Line type="monotone" dataKey="Forward_IG" stroke={forwardColor} name={`${result.displayName} Forward - IG`} strokeWidth={2} dot={false} connectNulls={false} />
                                        <Line type="monotone" dataKey="Backward_IG" stroke={backwardColor} name={`${result.displayName} Backward - IG`} strokeWidth={2} dot={false} connectNulls={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
    );
};


// IDVG 차트 컴포넌트 (수정됨)
// 👈 3. showLogScale, setShowLogScale props를 제거 (주석 처리)하고 내부 상태 yScaleType 추가
export const IDVGCharts = ({ resultArray, type, sortByValue, /* showLogScale, setShowLogScale, */ formatLinearCurrent }) => {
  const [showIG, setShowIG] = useState(false);
  const [showVthTangent, setShowVthTangent] = useState(false);
  const [hiddenLines, setHiddenLines] = useState(new Set());
  
  // 👈 4. 3단 토글을 위한 내부 상태 추가
  const [yScaleType, setYScaleType] = useState('log'); // 'log', 'linear', 'normalized'

  
  const handleLegendClick = (data) => {
    // ... (기존 코드와 동일) ...
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

  // 👈 5. ******** BUG FIX ********
  // wMap 로직을 아예 삭제함 (사용자 요청)
  // const wMap = useMemo(() => { ... });

  // Vth 접선 계산 (기존 코드와 동일)
  const calculateVthTangentInfo = (chartData, parameters) => {
      // ... (기존 코드와 동일) ...
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

  const allVGValues = [...new Set(resultArray.flatMap(result => result.chartData ? result.chartData.map(d => d.VG) : []))].sort((a, b) => a - b);

  // X축 Ticks (기존 코드와 동일)
  const minVG = allVGValues.length > 0 ? Math.floor(allVGValues[0]) : 0;
  const maxVG = allVGValues.length > 0 ? Math.ceil(allVGValues[allVGValues.length - 1]) : 0;
  const dynamicTicks = [];
  for (let i = minVG; i <= maxVG; i += 3) {
    dynamicTicks.push(i);
  }

  // 👈 6. combinedData 생성을 useMemo로 감싸고, yScaleType에 따라 데이터 가공
  const combinedData = useMemo(() => {
    if (allVGValues.length === 0) return []; // 👈 데이터 없으면 빈 배열 반환
    
    return allVGValues.map(vg => {
      const dataPoint = { VG: vg };
      resultArray.forEach((result, index) => {
        if (result.chartData) {
          const point = result.chartData.find(d => Math.abs(d.VG - vg) < 0.01);
          const key = result.displayName || `File${index + 1}`;
          
          // 👈 ******** BUG FIX ********
          // W_mm을 1로 고정
          const W_mm = 1.0; 
          
          const baseId = point?.ID ? Math.abs(point.ID) : null; // 👈 Abs(Id)
          let yValue = null;

          if (baseId !== null) {
            if (yScaleType === 'normalized') {
              // 👈 W_mm (1.0)으로 나눔
              yValue = baseId / W_mm; // 👈 Id/W (A/mm)
            } else {
              yValue = baseId; // 👈 Abs(Id) (A) - 'log' 또는 'linear'
            }
          }
          
          dataPoint[key] = yValue; // 👈 스케일에 맞는 Y값 할당
          dataPoint[`${key}_IG`] = point?.IG ? Math.abs(point.IG) : null; // 👈 IG도 절대값 처리

          // 👈 7. 접선 데이터(tangent)도 스케일에 맞게 가공
          if (showVthTangent && type === 'IDVG-Linear') {
            const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
            if (tangentInfo) {
              const tangentPoint = tangentInfo.tangentData.find(d => Math.abs(d.VG - vg) < 0.05);
              const baseTangentId = tangentPoint?.ID_tangent || null;
              let yTangentValue = null;
              
              if (baseTangentId !== null && baseTangentId > 0) { // 👈 0보다 큰 값만
                 if (yScaleType === 'normalized') {
                    yTangentValue = baseTangentId / W_mm; // 👈 W_mm (1.0)으로 나눔
                 } else if (yScaleType === 'linear') {
                    yTangentValue = baseTangentId; // 👈 리니어
                 }
                 // 👈 yScaleType === 'log' 이면 yTangentValue는 null
              }
              dataPoint[`${key}_tangent`] = yTangentValue;
            }
          }
        }
      });
      return dataPoint;
    });
  // 👈 8. useMemo 의존성 배열에서 wMap 삭제
  }, [allVGValues, resultArray, type, showVthTangent, yScaleType]);

  // 범례 렌더링 (기존 코드와 동일)
  const renderCustomLegend = ({ payload, onClick }) => (
    // ... (기존 코드와 동일) ...
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
  
  // 👈 9. Y축 속성을 동적으로 반환하는 헬퍼 함수
  const getYAxisProps = () => {
    switch (yScaleType) {
      case 'normalized':
        return {
          scale: "linear",
          domain: [0, 'auto'], // 👈 0부터 시작하도록
          label: "|ID|/W (A/1mm)",
          unit: "A/mm",
          log: false,
          formatter: (value) => value.toExponential(1)
        };
      case 'linear':
        return {
          scale: "linear",
          domain: [0, 'auto'], // 👈 0부터 시작하도록
          label: "|ID| (A)",
          unit: "A",
          log: false,
          // 👈 formatLinearCurrent prop이 있으면 사용, 없으면 기본 포맷
          formatter: formatLinearCurrent ? formatLinearCurrent : (value) => value.toExponential(1)
        };
      case 'log':
      default:
        // 👈 기존 Log 스케일의 domain을 유지
        const logMin = 1e-12;
        const logMax = 1e-3;
        return {
          scale: "log",
          domain: [logMin, logMax],
          label: "Log |ID| (A)",
          unit: "A",
          log: true,
          formatter: (value) => value.toExponential(0),
          allowDataOverflow: true
        };
    }
  };

  const yAxisProps = getYAxisProps();

  return (
    <div>
      <div className="flex items-center justify-end mb-4 flex-wrap gap-6">
        {/* IG 토글 (변경 없음) */}
        <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium transition-colors duration-300 ${!showIG ? 'text-gray-900' : 'text-gray-400'}`}>ID만 표시</span>
            <button onClick={() => setShowIG(!showIG)} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${showIG ? 'bg-gradient-to-r from-red-500 to-pink-600' : 'bg-gray-300'}`} title="IG (Gate Current) 표시/숨김">
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${showIG ? 'translate-x-9' : 'translate-x-1'}`}>
                    <div className="flex items-center justify-center h-full">{showIG ? <span className="text-xs text-red-600 font-bold">IG</span> : <span className="text-xs text-gray-600 font-bold">ID</span>}</div>
                </span>
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${showIG ? 'text-gray-900' : 'text-gray-400'}`}>ID + IG 표시</span>
        </div>
          
        {/* 접선 토글 (변경 없음) */}
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

        {/* 👈 10. 3단 토글 버튼 UI (세련되게 변경) */}
        <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-lg border shadow-sm">
          <button
            onClick={() => setYScaleType('log')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${yScaleType === 'log' ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          >
            Log |ID| (A)
          </button>
          <button
            onClick={() => setYScaleType('linear')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${yScaleType === 'linear' ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          >
            |ID| (A)
          </button>
          <button
            onClick={() => setYScaleType('normalized')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${yScaleType === 'normalized' ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
            title="Channel Width = 1mm (고정값)"
          >
            |ID|/W (A/mm)
          </button>
        </div>
      </div>
      
      {/* --- 차트 렌더링 --- */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ left: 18 }}>
            <CartesianGrid strokeDasharray="3 3" />
            
            {/* X축 (변경 없음) */}
            <XAxis 
              dataKey="VG" 
              label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
              domain={[minVG, maxVG]}
              ticks={dynamicTicks}
            />
            
            {/* 👈 11. Y축을 yAxisProps로 동적 설정 */}
            <YAxis 
              scale={yAxisProps.scale} 
              domain={yAxisProps.domain} 
              label={{ value: yAxisProps.label, angle: -90, position: 'insideLeft', offset: 5, dx: -15 }} 
              tickFormatter={yAxisProps.formatter} 
              allowDataOverflow={yAxisProps.allowDataOverflow}
              width={85} // 👈 라벨이 길어질 수 있으므로 너비 확보
            />
            
            {/* 👈 12. 툴팁에 yAxisProps 값 전달 */}
            <Tooltip content={<SampleNameTooltip 
                xAxisLabel="VG" 
                yAxisUnit={yAxisProps.unit} 
                sortByValue={sortByValue} 
                showLogScale={yAxisProps.log} 
                formatLinearCurrent={yAxisProps.formatter} 
             />} 
            />
            
            <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" content={renderCustomLegend} />
            
            {/* 데이터 라인 (변경 없음) */}
            {resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              return <Line key={index} type="monotone" dataKey={key} stroke={generateGoldenRatioColor(index)} strokeWidth={2} dot={false} name={key} connectNulls={false} hide={hiddenLines.has(key)} />;
            })}
            
            {/* 👈 13. 접선 라인 (데이터는 combinedData에서 이미 처리됨) */}
            {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              // 👈 Log 스케일에서는 렌더링 안 함
              if (yScaleType === 'log') return null;
              
              const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
              if (!tangentInfo) return null;
              return <Line key={`tangent-${index}`} type="monotone" dataKey={`${key}_tangent`} stroke={generateTangentColor(index)} strokeWidth={2} strokeDasharray="8 4" dot={false} legendType="none" connectNulls={false} hide={hiddenLines.has(key)} />;
            })}

            {/* Vth 기준선 (변경 없음) */}
            {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
                const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
                if (!tangentInfo) return null;
                
                // 👈 14. Vth 점의 Y좌표를 스케일에 따라 동적 설정
                const vthDotY = (yScaleType === 'log') ? yAxisProps.domain[0] : 0;
                
                return (
                  <React.Fragment key={`ref-${index}`}>
                    {/* 👈 gm_max VG 선 (Log 스케일에서는 숨김) */}
                    {yScaleType !== 'log' && (
                        <ReferenceLine x={tangentInfo.gmMaxVG} stroke={generateReferenceColor(index, 0)} strokeDasharray="4 4" strokeWidth={1} label={{ value: `gm_max VG`, position: "topLeft", style: { fontSize: '10px' } }} />
                    )}
                    {/* 👈 Vth 수직선 */}
                    <ReferenceLine x={tangentInfo.vth} stroke={generateReferenceColor(index, 60)} strokeDasharray="4 4" strokeWidth={2} label={{ value: `Vth=${tangentInfo.vth.toFixed(2)}V`, position: "bottomRight", style: { fontSize: '11px', fontWeight: 'bold' } }} />
                    {/* 👈 Vth x-절편 점 (Y좌표 수정됨) */}
                    <ReferenceLine x={tangentInfo.vth} y={vthDotY} stroke="transparent" dot={{ fill: generateReferenceColor(index, 60), stroke: generateReferenceColor(index, 90), strokeWidth: 2, r: 6 }} />
                  </React.Fragment>
                );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

     {/* IG 차트 (변경 없음) */}
     <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showIG ? 'max-h-[500px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
       <h4 className="text-lg font-semibold mb-4">IG-VG (Gate Current) 그래프</h4>
       <div className="h-80">
         <ResponsiveContainer width="100%" height="100%">
           <LineChart data={combinedData} margin={{ left: 18 }}>
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis dataKey="VG" label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} domain={[minVG, maxVG]} ticks={dynamicTicks} />
             {/* 👈 |IG| (A)로 라벨 수정, 툴팁 showLogScale={true} 명시 */}
             <YAxis scale="log" domain={[1e-12, 1e-6]} label={{ value: '|IG| (A)', angle: -90, position: 'insideLeft', dx: -10 }} tickFormatter={(value) => value.toExponential(0)} allowDataOverflow={true} />
             <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} showLogScale={true} />} />
             <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" />
             {resultArray.map((result, index) => {
               const key = result.displayName || `File${index + 1}`;
               return (
                 <Line key={`ig-${index}`} type="monotone" dataKey={`${key}_IG`} stroke={generateIGColor(index)} strokeWidth={2} dot={false} name={`${key} - IG`} connectNulls={false} hide={hiddenLines.has(key) || hiddenLines.has(`${key}_IG`)} />
               );
             })}
           </LineChart>
         </ResponsiveContainer>
       </div>
     </div>
   </div>
 );
};

// Gm 차트 컴포넌트 (변경 없음)
export const GmCharts = ({ resultArray, sortByValue }) => {
 const [hiddenLines, setHiddenLines] = useState(new Set());
 const handleLegendClick = (data) => {
   const { dataKey } = data;
   setHiddenLines(prev => {
     const newSet = new Set(prev);
     if (newSet.has(dataKey)) newSet.delete(dataKey);
     else newSet.add(dataKey);
     return newSet;
   });
 };

 const allVGValues = [...new Set(resultArray.flatMap(result => result.gmData ? result.gmData.map(d => d.VG) : []))].sort((a, b) => a - b);
 if (allVGValues.length === 0) return null;

  //추가
  const minVG = Math.floor(allVGValues[0]);
  const maxVG = Math.ceil(allVGValues[allVGValues.length - 1]);
  const dynamicTicks = [];
  for (let i = minVG; i <= maxVG; i += 3) {
    dynamicTicks.push(i);
  }
 const combinedGmData = allVGValues.map(vg => {
   const dataPoint = { VG: vg };
   resultArray.forEach((result, index) => {
     if (result.gmData) {
       const point = result.gmData.find(d => Math.abs(d.VG - vg) < 0.01);
       const key = result.displayName || `File${index + 1}`;
       dataPoint[`${key}_gm`] = point?.gm || null;
     }
   });
   return dataPoint;
 });

 return (
   <div className="h-80">
     <ResponsiveContainer width="100%" height="100%">
       <LineChart data={combinedGmData} margin={{ left: 18 }}>
         <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
              dataKey="VG" 
              label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} 
              domain={[minVG, maxVG]}
              ticks={dynamicTicks}
            />
         <YAxis scale="linear" domain={['auto', 'auto']} label={{ value: 'gm (S)', angle: -90, position: 'insideLeft', offset: 5, dx: -15 }} tickFormatter={(value) => value.toExponential(1)} />
         <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="S" sortByValue={sortByValue} showLogScale={false} formatLinearCurrent={(value) => value.toExponential(2)} />} />
         <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" />
         {resultArray.map((result, index) => {
           if (!result.gmData) return null;
           const key = result.displayName || `File${index + 1}`;
           return <Line key={index} type="monotone" dataKey={`${key}_gm`} stroke={generateGmColor(index)} strokeWidth={2} dot={false} name={`${key} - gm`} connectNulls={false} hide={hiddenLines.has(`${key}_gm`)} />;
         })}
       </LineChart>
     </ResponsiveContainer>
   </div>
 );
};