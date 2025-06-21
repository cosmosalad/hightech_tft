import React, { useState, useEffect, useRef } from 'react';
import { X, Calculator, TrendingUp, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { calculateSS } from '../parameters/ss.js';

const SSRangeEditor = ({
  isOpen,
  onClose,
  chartData,
  currentSS,
  sampleName,
  onApplyResult
}) => {
  const [startVG, setStartVG] = useState(0);
  const [endVG, setEndVG] = useState(0);
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const [dragStartX, setDragStartX] = useState(null);
  const [dragEndX, setDragEndX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // 초기값 설정 및 미리보기 데이터 생성
  useEffect(() => {
    if (isOpen && chartData && chartData.length > 0) {
      const vgValues = chartData.map(d => d.VG).sort((a, b) => a - b);
      const minVG = vgValues[0];
      const maxVG = vgValues[vgValues.length - 1];

      const initialStartValue = parseFloat((minVG + (maxVG - minVG) * 0.3).toFixed(1));
      const initialEndValue = parseFloat((minVG + (maxVG - minVG) * 0.7).toFixed(1));

      setStartVG(initialStartValue);
      setEndVG(initialEndValue);
      setCalculationResult(null);

      console.log(`Initial VG range: ${initialStartValue}V to ${initialEndValue}V`);
    }
  }, [isOpen, chartData]);

  // 미리보기 데이터 생성 및 범위 하이라이트
  const generatePreviewData = () => {
    if (!chartData) return;

    const sortedPreview = [...chartData].map(d => ({
      VG: d.VG,
      logID: Math.log10(Math.abs(d.ID)),
      ID: d.ID
    })).filter(d => isFinite(d.logID)).sort((a, b) => a.VG - b.VG);

    setPreviewData(sortedPreview);
  };

  useEffect(() => {
    generatePreviewData();
  }, [startVG, endVG, chartData]);

  // SS 계산 실행
  const handleCalculate = () => {
    if (!chartData || isNaN(startVG) || isNaN(endVG) || startVG >= endVG) {
      alert('유효하지 않은 VG 범위입니다. 시작 VG가 종료 VG보다 작아야 합니다.');
      return;
    }

    setIsCalculating(true);
    setCalculationResult(null);

    try {
      const selectedData = chartData.filter(d =>
        d.VG >= startVG && d.VG <= endVG
      );

      if (selectedData.length < 3) {
        alert('선택된 범위에 데이터가 부족합니다 (최소 3개 점 필요).');
        setIsCalculating(false);
        return;
      }

      const ssResult = calculateSS(chartData, {
        customRange: true,
        startVG: startVG,
        endVG: endVG
      });

      const logData = selectedData.map(d => ({
        VG: d.VG,
        logID: Math.log10(Math.abs(d.ID))
      })).filter(d => isFinite(d.logID));

      if (logData.length < 3) {
        alert('선택된 범위에 유효한 데이터가 부족합니다.');
        setIsCalculating(false);
        return;
      }

      const x = logData.map(d => d.VG);
      const y = logData.map(d => d.logID);
      const n = x.length;

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

      const denominator = (n * sumXX - sumX * sumX);
      if (denominator === 0) {
        setCalculationResult({
          ss: Infinity,
          rSquared: 0,
          dataPoints: logData.length,
          slope: 0,
          intercept: 0,
          range: { startVG: startVG, endVG: endVG }
        });
        setIsCalculating(false);
        return;
      }

      const slope = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / n;

      const yMean = sumY / n;
      const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
      const ssResidual = x.reduce((sum, xi, i) => {
        const predicted = slope * xi + intercept;
        return sum + Math.pow(y[i] - predicted, 2);
      }, 0);

      const rSquared = (ssTotal === 0) ? 1 : Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal)));

      setCalculationResult({
        ss: ssResult,
        rSquared: rSquared,
        dataPoints: logData.length,
        slope: slope,
        intercept: intercept,
        range: { startVG: startVG, endVG: endVG }
      });

      console.log(`SS calculation completed: ${ssResult.toFixed(1)} mV/decade, R² = ${rSquared.toFixed(3)}`);

    } catch (error) {
      console.error('SS 계산 오류:', error);
      alert('계산 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyResult = () => {
    if (calculationResult && onApplyResult) {
      onApplyResult({
        newSS: calculationResult.ss,
        rSquared: calculationResult.rSquared,
        dataPoints: calculationResult.dataPoints,
        range: calculationResult.range,
        method: 'User Custom Range'
      });
      onClose();
    }
  };

  const getQualityAssessment = () => {
    if (!calculationResult) return null;

    const { rSquared, dataPoints, ss } = calculationResult;

    let quality = '매우 미흡';
    let color = 'text-red-600';
    let bgColor = 'bg-red-50';
    let borderColor = 'border-red-400';
    let icon = <AlertTriangle className="w-5 h-5 mr-2" />;
    let issues = [];

    if (rSquared >= 0.95 && dataPoints >= 5 && ss < 100) {
      quality = '우수';
      color = 'text-green-700';
      bgColor = 'bg-green-100';
      borderColor = 'border-green-500';
      icon = <CheckCircle className="w-5 h-5 mr-2" />;
    } else if (rSquared >= 0.90 && dataPoints >= 5 && ss < 500) {
      quality = '양호';
      color = 'text-blue-700';
      bgColor = 'bg-blue-100';
      borderColor = 'border-blue-500';
      icon = <CheckCircle className="w-5 h-5 mr-2" />;
    } else if (rSquared >= 0.85 && dataPoints >= 3 && ss < 1000) {
      quality = '보통';
      color = 'text-yellow-700';
      bgColor = 'bg-yellow-100';
      borderColor = 'border-yellow-500';
      icon = <AlertTriangle className="w-5 h-5 mr-2" />;
    } else if (ss < 1500) {
      quality = '미흡';
      color = 'text-orange-700';
      bgColor = 'bg-orange-100';
      borderColor = 'border-orange-500';
      icon = <AlertTriangle className="w-5 h-5 mr-2" />;
    }

    if (rSquared < 0.85) issues.push('낮은 선형성 (R² < 0.85)');
    if (dataPoints < 5) issues.push('데이터 포인트 부족');
    if (ss > 1500) issues.push('매우 높은 SS 값 (> 1.5V/decade)');
    else if (ss > 1000) issues.push('높은 SS 값 (> 1V/decade)');
    else if (ss > 500) issues.push('다소 높은 SS 값 (> 500 mV/decade)');

    return { quality, color, bgColor, borderColor, icon, issues };
  };

  const setRecommendedRange = (type) => {
    if (!chartData || chartData.length === 0) return;

    const vgValues = chartData.map(d => d.VG).sort((a, b) => a - b);
    const minVG = vgValues[0];
    const maxVG = vgValues[vgValues.length - 1];

    setCalculationResult(null);

    switch (type) {
      case 'subthreshold':
        setStartVG(-2.0);
        setEndVG(2.0);
        break;
      case 'switching':
        setStartVG(-1.0);
        setEndVG(1.0);
        break;
      case 'negative':
        setStartVG(parseFloat(Math.max(minVG, -3).toFixed(1)));
        setEndVG(0.0);
        break;
      case 'positive':
        setStartVG(0.0);
        setEndVG(parseFloat(Math.min(maxVG, 3).toFixed(1)));
        break;
      case 'full':
        setStartVG(minVG);
        setEndVG(maxVG);
        break;
      default:
        break;
    }
  };

  const qualityInfo = getQualityAssessment();

  const handleChartMouseDown = (e) => {
    if (e.activeLabel !== undefined) {
      setDragStartX(e.activeLabel);
      setIsDragging(true);
      setDragEndX(null);
      setCalculationResult(null);
    }
  };

  const handleChartMouseMove = (e) => {
    if (isDragging && e.activeLabel !== undefined) {
      setDragEndX(e.activeLabel);
    }
  };

  const handleChartMouseUp = () => {
    if (isDragging && dragStartX !== null && dragEndX !== null) {
      const finalStartVG = parseFloat(Math.min(dragStartX, dragEndX).toFixed(1));
      const finalEndVG = parseFloat(Math.max(dragStartX, dragEndX).toFixed(1));
      setStartVG(finalStartVG);
      setEndVG(finalEndVG);
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragEndX(null);
  };

  const handleChartMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartX(null);
      setDragEndX(null);
    }
  };

  if (!isOpen) return null;

  const currentSelectedMinVG = Math.min(startVG, endVG);
  const currentSelectedMaxVG = Math.max(startVG, endVG);
  const pointsInCurrentRange = previewData.filter(d => d.VG >= currentSelectedMinVG && d.VG <= currentSelectedMaxVG).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      {/* 모달 전체 컨테이너: 그림자 및 둥근 모서리 강화, 최대 너비 확장 (max-w-7xl로 확장) */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto transform scale-100 transition-all duration-300">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-2xl">
          <div className="flex items-center">
            <Calculator className="w-7 h-7 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">SS 값 수정</h2>
              <p className="text-sm text-gray-600 mt-1">{sampleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="모달 닫기"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {/* 현재 값 표시 섹션: 더 넓은 패딩과 강조된 스타일 */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-sm flex items-center justify-between">
            <h3 className="font-semibold text-lg text-blue-800">현재 SS 값</h3>
            <div className="text-2xl font-mono text-blue-700 font-bold">
              {currentSS} mV/decade
            </div>
          </div>

          {/* 레이아웃 변경: 왼쪽 컨트롤 1열, 오른쪽 그래프 2열 (총 3열처럼) */}
          {/* `lg:grid-cols-3`는 유지하되, 각 컬럼의 `col-span`을 명확히 함 */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 왼쪽: 범위 설정 및 계산 (1열 차지) */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-purple-600" />
                선형 구간 선택
              </h3>

              {/* 추천 범위 버튼들 */}
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-base font-semibold text-purple-800 mb-3">🎯 추천 범위</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <button
                    onClick={() => setRecommendedRange('switching')}
                    className="px-3 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-md transition-colors font-medium shadow-sm hover:shadow-md hover:brightness-90"
                  >
                    스위칭 (-1V ~ 1V)
                  </button>
                  <button
                    onClick={() => setRecommendedRange('subthreshold')}
                    className="px-3 py-2 bg-green-100 text-green-800 hover:bg-green-200 rounded-md transition-colors font-medium shadow-sm hover:shadow-md hover:brightness-90"
                  >
                    서브임계 (-2V ~ 2V)
                  </button>
                  <button
                    onClick={() => setRecommendedRange('negative')}
                    className="px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md transition-colors font-medium shadow-sm hover:shadow-md hover:brightness-90"
                  >
                    음의 영역만
                  </button>
                  <button
                    onClick={() => setRecommendedRange('positive')}
                    className="px-3 py-2 bg-orange-100 text-orange-800 hover:bg-orange-200 rounded-md transition-colors font-medium shadow-sm hover:shadow-md hover:brightness-90"
                  >
                    양의 영역만
                  </button>
                   <button
                    onClick={() => setRecommendedRange('full')}
                    className="px-3 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md transition-colors col-span-2 font-medium shadow-sm hover:shadow-md hover:brightness-90"
                  >
                    전체 범위
                  </button>
                </div>
              </div>

              {/* VG 범위 입력 */}
              <div className="space-y-5 mb-8">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="startVgInput" className="block text-sm font-medium text-gray-700 mb-2">
                      시작 VG (V)
                    </label>
                    <input
                      id="startVgInput"
                      type="number"
                      step="0.1"
                      min="-20"
                      max="20"
                      value={isNaN(startVG) ? '' : startVG.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '-') {
                            setStartVG(NaN);
                        } else {
                            setStartVG(parseFloat(val));
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="-1.0"
                    />
                  </div>
                  <div>
                    <label htmlFor="endVgInput" className="block text-sm font-medium text-gray-700 mb-2">
                      종료 VG (V)
                    </label>
                    <input
                      id="endVgInput"
                      type="number"
                      step="0.1"
                      min="-20"
                      max="20"
                      value={isNaN(endVG) ? '' : endVG.toString()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '-') {
                            setEndVG(NaN);
                        } else {
                            setEndVG(parseFloat(val));
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="1.0"
                    />
                  </div>
                </div>

                {/* 선택 가이드박스: 아이콘 추가 및 스타일 개선 */}
                <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start space-x-2">
                  <Flame className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-blue-800">선택 가이드:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Subthreshold 영역에서 선형성이 좋은 구간 선택</li>
                      <li>• 최소 3개 이상의 데이터 포인트 필요</li>
                      <li>• R² &gt; 0.9 목표로 범위 조정</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={isCalculating || isNaN(startVG) || isNaN(endVG) || startVG >= endVG}
                  className="w-full py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                >
                  {isCalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      계산 중...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5 mr-3" />
                      SS 계산 실행
                    </>
                  )}
                </button>

                {/* 현재 선택된 범위 정보: 깔끔한 배경과 글꼴 */}
                {previewData.length > 0 && (
                  <div className="text-xs text-gray-700 bg-gray-100 p-3 rounded-md border border-gray-200">
                    <strong>선택된 범위:</strong> {isNaN(startVG) ? 'N/A' : startVG.toFixed(1)}V ~ {isNaN(endVG) ? 'N/A' : endVG.toFixed(1)}V<br />
                    <strong>포함된 데이터:</strong> {pointsInCurrentRange}개 포인트
                  </div>
                )}
              </div>

              {/* 계산 결과 섹션 */}
              {calculationResult && (
                <div className="space-y-5">
                  <h4 className="font-semibold text-xl text-gray-800 flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    최종 계산 결과
                  </h4>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-5 rounded-lg border border-green-200 shadow-md">
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div>
                        <span className="text-gray-600">새 SS:</span>
                        <div className="font-bold text-xl text-blue-700">
                          {calculationResult.ss.toFixed(1)} mV/decade
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">R²:</span>
                        <div className="font-bold text-xl text-green-700">
                          {calculationResult.rSquared.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">포인트 수:</span>
                        <div className="font-semibold text-lg text-gray-800">{calculationResult.dataPoints}개</div>
                      </div>
                      <div>
                        <span className="text-gray-600">적용 범위:</span>
                        <div className="font-semibold text-lg text-gray-800">{calculationResult.range.startVG.toFixed(1)}V ~ {calculationResult.range.endVG.toFixed(1)}V</div>
                      </div>
                    </div>
                  </div>

                  {/* 품질 평가 섹션: 배경색, 테두리, 아이콘 활용 */}
                  {qualityInfo && (
                    <div className={`p-4 rounded-lg ${qualityInfo.bgColor} border ${qualityInfo.borderColor} shadow-sm`}>
                      <div className={`font-bold text-lg ${qualityInfo.color} mb-2 flex items-center`}>
                        {qualityInfo.icon}
                        품질 평가: {qualityInfo.quality}
                      </div>
                      {qualityInfo.issues.length > 0 && (
                        <div className="text-sm">
                          <div className={`flex items-center ${qualityInfo.color} font-medium mb-1`}>
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            주의사항:
                          </div>
                          <ul className={`${qualityInfo.color} text-xs space-y-1 ml-6 list-disc`}>
                            {qualityInfo.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 오른쪽: 미리보기 그래프 (2열) - 가로 폭을 더 넓게 할당 */}
            <div className="lg:col-span-2"> {/* lg 화면에서 2열을 차지하도록 변경 */}
              <h3 className="text-xl font-semibold text-gray-800 mb-5">데이터 미리보기 (드래그하여 범위 선택)</h3>

              {previewData.length > 0 ? (
                // 그래프 높이 유지 (h-[600px]), 가로 공간 최대한 활용
                <div className="h-[600px] bg-gray-50 rounded-lg p-4 cursor-crosshair user-select-none shadow-md border border-gray-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={previewData}
                      onMouseDown={handleChartMouseDown}
                      onMouseMove={handleChartMouseMove}
                      onMouseUp={handleChartMouseUp}
                      onMouseLeave={handleChartMouseLeave}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="VG"
                        label={{ value: 'VG (V)', position: 'insideBottom', offset: -5, fill: '#4a5568', fontSize: '14px' }}
                        type="number"
                        scale="linear"
                        domain={['dataMin', 'dataMax']}
                        stroke="#718096"
                      />
                      <YAxis
                        label={{ value: 'log₁₀(ID)', angle: -90, position: 'insideLeft', fill: '#4a5568', fontSize: '14px' }}
                        type="number"
                        scale="linear"
                        domain={['dataMin', 'dataMax']}
                        stroke="#718096"
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(3) : value,
                          name === 'logID' ? 'log₁₀(ID)' : name
                        ]}
                        labelFormatter={(value) => `VG: ${value}V`}
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#333' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="logID"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={(props) => {
                          const inCurrentRange = props.payload.VG >= currentSelectedMinVG && props.payload.VG <= currentSelectedMaxVG;
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={inCurrentRange ? 4.5 : 2.5}
                              fill={inCurrentRange ? "#E04C4C" : "#3B82F6"}
                              stroke={inCurrentRange ? "#C02C2C" : "#2563EB"}
                              strokeWidth={1.5}
                            />
                          );
                        }}
                        connectNulls={false}
                      />
                      {/* 드래그 중인 영역 표시 */}
                      {isDragging && dragStartX !== null && dragEndX !== null && (
                        <ReferenceArea
                          x1={Math.min(dragStartX, dragEndX)}
                          x2={Math.max(dragStartX, dragEndX)}
                          fill="#8B5CF6"
                          fillOpacity={0.3}
                          stroke="#7C3AED"
                          strokeWidth={1}
                        />
                      )}
                      {/* 최종 선택된 영역 표시 (드래그와 별개, 고정) */}
                       {!isDragging && (
                        <ReferenceArea
                          x1={currentSelectedMinVG}
                          x2={currentSelectedMaxVG}
                          fill="#FCA5A5"
                          fillOpacity={0.2}
                          stroke="#EF4444"
                          strokeWidth={1}
                        />
                       )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[600px] bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 border border-gray-200 shadow-md">
                  표시할 데이터가 없습니다.
                </div>
              )}

              {/* 그래프 아래 정보 박스: 스타일 개선 */}
              <div className="mt-6 text-sm text-gray-700 bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-6 mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    전체 데이터
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    선택 중인 범위 (드래그)
                  </div>
                   <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    현재 적용 범위
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div><strong>총 데이터 포인트:</strong> {previewData.length}개</div>
                  <div><strong>선택된 범위 포인트:</strong> {pointsInCurrentRange}개</div>
                  <div><strong>현재 VG 범위:</strong> {isNaN(startVG) ? 'N/A' : startVG.toFixed(1)}V ~ {isNaN(endVG) ? 'N/A' : endVG.toFixed(1)}V</div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼 섹션: 간격, 정렬, 스타일 개선 */}
          <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              취소
            </button>
            <button
              onClick={handleApplyResult}
              disabled={!calculationResult}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-3" />
              결과 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSRangeEditor;