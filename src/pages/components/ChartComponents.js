// C:\Users\HYUN\hightech_tft\src\pages\components\ChartComponents.js

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// Tooltip 컴포넌트
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
              const nameMatch = entry.name ? entry.name.match(/(.+?)\s*\((.+?)\)/) : null;
              if (nameMatch) {
                sampleName = nameMatch[1];
                measurementInfo = ` - ${nameMatch[2]}`;
              }
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
                  {showLogScale ? entry.value.toExponential(2) : formatLinearCurrent ? formatLinearCurrent(entry.value) : entry.value.toExponential(2)} {yAxisUnit}
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

// IDVD 차트 컴포넌트
export const IDVDCharts = ({ resultArray, hasMultipleFiles, sortByValue }) => {
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
                  <Tooltip content={<SampleNameTooltip xAxisLabel="VD" yAxisUnit="A" sortByValue={sortByValue} />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" />
                  {result.gateVoltages && result.gateVoltages.map((vg, vgIndex) => {
                    const lineKey = `VG_${vg}V`;
                    return (
                      <Line key={vg} type="monotone" dataKey={lineKey} stroke={`hsl(${(vgIndex * 60) % 360}, 70%, 50%)`} strokeWidth={2} dot={false} name={`${result.displayName} VG=${vg}V`} hide={hiddenLines.has(lineKey)} />
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

// Hysteresis 차트 컴포넌트 (범례 클릭 기능 제거됨)
export const HysteresisCharts = ({ resultArray, hasMultipleFiles, sortByValue }) => {
    // Hysteresis 차트만의 독립적인 showIG 상태만 남깁니다.
    const [showIG, setShowIG] = useState(false);
    
    // handleLegendClick 함수와 hiddenLines 상태가 제거되었습니다.
    
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
            {resultArray.map((result, index) => {
                if (!result.forwardData || !result.backwardData) return null;
                const allVGValues = [...new Set([...result.forwardData.map(d => d.VG), ...result.backwardData.map(d => d.VG)])].sort((a, b) => a - b);
                const combinedData = allVGValues.map(vg => {
                    const forwardPoint = result.forwardData.find(d => Math.abs(d.VG - vg) < 0.01);
                    const backwardPoint = result.backwardData.find(d => Math.abs(d.VG - vg) < 0.01);
                    return { VG: vg, Forward: forwardPoint?.ID || null, Backward: backwardPoint?.ID || null, Forward_IG: forwardPoint?.IG || null, Backward_IG: backwardPoint?.IG || null };
                });

                return (
                    <div key={index} className="relative">
                        {hasMultipleFiles && (<h4 className="text-md font-medium mb-3 text-gray-700 bg-gray-100 p-2 rounded">{result.displayName}</h4>)}
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
                                <LineChart data={combinedData} margin={{ left: 18 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="VG" label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} />
                                    <YAxis scale="log" domain={[1e-12, 1e-3]} label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', dx: -10 }} tickFormatter={(value) => value.toExponential(0)} />
                                    <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} />} />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line"/>
                                    <Line type="monotone" dataKey="Forward" stroke="#2563eb" name={`${result.displayName} Forward`} strokeWidth={2} dot={false} connectNulls={false} />
                                    <Line type="monotone" dataKey="Backward" stroke="#dc2626" name={`${result.displayName} Backward`} strokeWidth={2} dot={false} connectNulls={false} />
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
                                        <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} />} />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="line"/>
                                        <Line type="monotone" dataKey="Forward_IG" stroke="#2563eb" name={`${result.displayName} Forward - IG`} strokeWidth={2} dot={false} connectNulls={false} />
                                        <Line type="monotone" dataKey="Backward_IG" stroke="#dc2626" name={`${result.displayName} Backward - IG`} strokeWidth={2} dot={false} connectNulls={false} />
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


// IDVG 차트 컴포넌트
export const IDVGCharts = ({ resultArray, type, sortByValue, showLogScale, setShowLogScale, formatLinearCurrent }) => {
  const [showIG, setShowIG] = useState(false);
  const [showVthTangent, setShowVthTangent] = useState(false);
  const [hiddenLines, setHiddenLines] = useState(new Set());
  
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

  const calculateVthTangentInfo = (chartData, parameters) => {
    if (!chartData || !parameters || type !== 'IDVG-Linear') return null;
    const vthStr = parameters.Vth;
    const gmMaxStr = parameters.gm_max;
    if (!vthStr || !gmMaxStr) return null;
    const vth = parseFloat(vthStr.split(' ')[0]);
    const gmMax = parseFloat(gmMaxStr.split(' ')[0]);
    if (isNaN(vth) || isNaN(gmMax)) return null;

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
      const idTangent = gmMax * (vg - vth);
      tangentData.push({ VG: parseFloat(vg.toFixed(1)), ID_tangent: idTangent > 0 ? idTangent : null });
    }
    return { vth, gmMax, gmMaxVG, tangentData };
  };

  const allVGValues = [...new Set(resultArray.flatMap(result => result.chartData ? result.chartData.map(d => d.VG) : []))].sort((a, b) => a - b);
  if (allVGValues.length === 0) return null;

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

        <div className="flex items-center space-x-4">
            <span className={`text-sm font-medium transition-colors duration-300 ${!showLogScale ? 'text-gray-900' : 'text-gray-400'}`}>실제값</span>
            <button onClick={() => setShowLogScale(!showLogScale)} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showLogScale ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${showLogScale ? 'translate-x-9' : 'translate-x-1'}`}>
                    <div className="flex items-center justify-center h-full">{showLogScale ? <span className="text-xs text-blue-600 font-bold">log</span> : <span className="text-xs text-gray-600 font-bold">lin</span>}</div>
                </span>
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${showLogScale ? 'text-gray-900' : 'text-gray-400'}`}>로그값</span>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ left: 18 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="VG" label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} />
            <YAxis scale={showLogScale ? "log" : "linear"} domain={showLogScale ? [1e-12, 1e-3] : ['auto', 'auto']} label={{ value: 'ID (A)', angle: -90, position: 'insideLeft', offset: 5 }} tickFormatter={(value) => showLogScale ? value.toExponential(0) : formatLinearCurrent(value)} />
            <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} showLogScale={showLogScale} formatLinearCurrent={formatLinearCurrent} />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" content={renderCustomLegend} />
            {resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              return <Line key={index} type="monotone" dataKey={key} stroke={`hsl(${index * 120}, 70%, 50%)`} strokeWidth={2} dot={false} name={key} connectNulls={false} hide={hiddenLines.has(key)} />;
            })}
            {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
              const key = result.displayName || `File${index + 1}`;
              const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
              if (!tangentInfo) return null;
              return <Line key={`tangent-${index}`} type="monotone" dataKey={`${key}_tangent`} stroke={`hsl(${index * 120 + 30}, 80%, 45%)`} strokeWidth={2} strokeDasharray="8 4" dot={false} legendType="none" connectNulls={false} hide={hiddenLines.has(key)} />;
            })}
            {showVthTangent && type === 'IDVG-Linear' && resultArray.map((result, index) => {
                const tangentInfo = calculateVthTangentInfo(result.chartData, result.parameters);
                if (!tangentInfo) return null;
                return (
                  <React.Fragment key={`ref-${index}`}>
                    <ReferenceLine x={tangentInfo.gmMaxVG} stroke={`hsl(${index * 120}, 60%, 40%)`} strokeDasharray="4 4" strokeWidth={1} label={{ value: `gm_max VG`, position: "topLeft", style: { fontSize: '10px' } }} />
                    <ReferenceLine x={tangentInfo.vth} stroke={`hsl(${index * 120 + 60}, 70%, 35%)`} strokeDasharray="4 4" strokeWidth={2} label={{ value: `Vth=${tangentInfo.vth.toFixed(2)}V`, position: "bottomRight", style: { fontSize: '11px', fontWeight: 'bold' } }} />
                    <ReferenceLine x={tangentInfo.vth} y={0} stroke="transparent" dot={{ fill: `hsl(${index * 120 + 60}, 80%, 40%)`, stroke: `hsl(${index * 120 + 60}, 90%, 20%)`, strokeWidth: 2, r: 6 }} />
                  </React.Fragment>
                );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showIG ? 'max-h-[500px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'}`}>
        <h4 className="text-lg font-semibold mb-4">IG-VG (Gate Current) 그래프</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData} margin={{ left: 18 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="VG" label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} />
              <YAxis scale="log" domain={[1e-12, 1e-6]} label={{ value: 'IG (A)', angle: -90, position: 'insideLeft', dx: -10 }} tickFormatter={(value) => value.toExponential(0)} />
              <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="A" sortByValue={sortByValue} />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" />
              {resultArray.map((result, index) => {
                const key = result.displayName || `File${index + 1}`;
                return (
                  <Line key={`ig-${index}`} type="monotone" dataKey={`${key}_IG`} stroke={`hsl(${index * 120}, 80%, 65%)`} strokeWidth={2} dot={false} name={`${key} - IG`} connectNulls={false} hide={hiddenLines.has(`${key}_IG`)} />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Gm 차트 컴포넌트
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
          <XAxis dataKey="VG" label={{ value: 'VG (V)', position: 'insideBottom', offset: -10 }} />
          <YAxis scale="linear" domain={['auto', 'auto']} label={{ value: 'gm (S)', angle: -90, position: 'insideLeft', offset: 5, dx: -15 }} tickFormatter={(value) => value.toExponential(1)} />
          <Tooltip content={<SampleNameTooltip xAxisLabel="VG" yAxisUnit="S" sortByValue={sortByValue} showLogScale={false} formatLinearCurrent={(value) => value.toExponential(2)} />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} onClick={handleLegendClick} iconType="line" />
          {resultArray.map((result, index) => {
            if (!result.gmData) return null;
            const key = result.displayName || `File${index + 1}`;
            return <Line key={index} type="monotone" dataKey={`${key}_gm`} stroke={`hsl(${index * 120 + 180}, 70%, 50%)`} strokeWidth={2} dot={false} name={`${key} - gm`} connectNulls={false} hide={hiddenLines.has(`${key}_gm`)} />;
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};