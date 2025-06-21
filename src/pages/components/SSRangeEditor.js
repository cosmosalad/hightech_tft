import React, { useState, useEffect, useRef } from 'react';
import { X, Calculator, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
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
  // startVG와 endVG를 숫자로 직접 관리
  const [startVG, setStartVG] = useState(0);
  const [endVG, setEndVG] = useState(0);
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // 드래그 선택 관련 상태
  const [dragStartX, setDragStartX] = useState(null); // 드래그 시작 시 VG 값
  const [dragEndX, setDragEndX] = useState(null);   // 드래그 중인 현재 VG 값
  const [isDragging, setIsDragging] = useState(false);

  // 초기값 설정 및 미리보기 데이터 생성
  useEffect(() => {
    if (isOpen && chartData && chartData.length > 0) {
      const vgValues = chartData.map(d => d.VG).sort((a, b) => a - b);
      const minVG = vgValues[0];
      const maxVG = vgValues[vgValues.length - 1];

      // 기본값: 전체 범위의 30-70% 구간으로 설정
      const initialStartValue = parseFloat((minVG + (maxVG - minVG) * 0.3).toFixed(1));
      const initialEndValue = parseFloat((minVG + (maxVG - minVG) * 0.7).toFixed(1));

      setStartVG(initialStartValue);
      setEndVG(initialEndValue);
      setCalculationResult(null); // 모달 열릴 때마다 결과 초기화

      console.log(`Initial VG range: ${initialStartValue}V to ${initialEndValue}V`);
    }
  }, [isOpen, chartData]);

  // 미리보기 데이터 생성 및 범위 하이라이트
  const generatePreviewData = () => {
    if (!chartData) return;

    // 유효하지 않은 입력값 처리 (NaN이면 미리보기 데이터 생성 중단)
    if (isNaN(startVG) || isNaN(endVG)) {
      setPreviewData([]); // 유효하지 않으면 미리보기 데이터 비움
      return;
    }

    // VG 값 순으로 정렬하여 올바른 범위 계산을 보장
    const sortedPreview = [...chartData].map(d => ({
      VG: d.VG,
      logID: Math.log10(Math.abs(d.ID)),
      ID: d.ID // 원본 ID 값도 유지
    })).filter(d => isFinite(d.logID)).sort((a, b) => a.VG - b.VG);

    setPreviewData(sortedPreview);
  };

  // VG 범위 변경 및 드래그 상태 변경 시 미리보기 업데이트
  useEffect(() => {
    generatePreviewData();
  }, [startVG, endVG, chartData]); // 의존성에 startVG, endVG 추가

  // SS 계산 실행
  const handleCalculate = () => {
    // startVG와 endVG가 이미 숫자이므로 변환 불필요
    if (!chartData || isNaN(startVG) || isNaN(endVG) || startVG >= endVG) {
      alert('유효하지 않은 VG 범위입니다. 시작 VG가 종료 VG보다 작아야 합니다.');
      return;
    }

    setIsCalculating(true);
    setCalculationResult(null); // 새 계산 시작 시 이전 결과 초기화

    try {
      // 선택된 범위의 데이터 필터링
      const selectedData = chartData.filter(d =>
        d.VG >= startVG && d.VG <= endVG
      );

      if (selectedData.length < 3) {
        alert('선택된 범위에 데이터가 부족합니다 (최소 3개 점 필요).');
        setIsCalculating(false);
        return;
      }

      // SS 계산
      const ssResult = calculateSS(chartData, {
        customRange: true,
        startVG: startVG,
        endVG: endVG
      });

      // R² 계산을 위한 선형 회귀
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

      // 분모가 0이 되는 경우 방지
      const denominator = (n * sumXX - sumX * sumX);
      if (denominator === 0) {
        setCalculationResult({
          ss: Infinity, // 또는 적절한 오류 값
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

      // R² 계산
      const yMean = sumY / n;
      const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
      const ssResidual = x.reduce((sum, xi, i) => {
        const predicted = slope * xi + intercept;
        return sum + Math.pow(y[i] - predicted, 2);
      }, 0);

      const rSquared = (ssTotal === 0) ? 1 : Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal))); // ssTotal이 0인 경우 처리

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

  // 결과 적용
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

  // 품질 평가
const getQualityAssessment = () => {
  if (!calculationResult) return null;

  const { rSquared, dataPoints, ss } = calculationResult;

  let quality = '매우 미흡';
  let color = 'text-red-600';
  let bgColor = 'bg-red-50';
  let issues = [];

  if (rSquared >= 0.95 && dataPoints >= 5 && ss < 100) {
    quality = '우수';
    color = 'text-green-600';
    bgColor = 'bg-green-50';
  } else if (rSquared >= 0.90 && dataPoints >= 5 && ss < 500) {
    quality = '양호';
    color = 'text-blue-600';
    bgColor = 'bg-blue-50';
  } else if (rSquared >= 0.85 && dataPoints >= 3 && ss < 1000) {
    quality = '보통';
    color = 'text-yellow-600';
    bgColor = 'bg-yellow-50';
  } else if (ss < 1500) { // R^2 기준을 충족하지 못해도 SS 값으로 최소 평가
    quality = '미흡';
    color = 'text-orange-600';
    bgColor = 'bg-orange-50';
  }

  if (rSquared < 0.85) issues.push('낮은 선형성 (R² < 0.85)');
  if (dataPoints < 5) issues.push('데이터 포인트 부족');
  if (ss > 1500) issues.push('매우 높은 SS 값 (> 1.5V/decade)');
  else if (ss > 1000) issues.push('높은 SS 값 (> 1V/decade)');
  else if (ss > 500) issues.push('다소 높은 SS 값 (> 500 mV/decade)');

  return { quality, color, bgColor, issues };
};

  // 추천 범위 설정 함수
  const setRecommendedRange = (type) => {
    if (!chartData || chartData.length === 0) return;

    const vgValues = chartData.map(d => d.VG).sort((a, b) => a - b);
    const minVG = vgValues[0];
    const maxVG = vgValues[vgValues.length - 1];

    // 초기화 시 calculationResult도 null로 설정
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
      case 'full': // 전체 범위 추가
        setStartVG(minVG);
        setEndVG(maxVG);
        break;
      default:
        break;
    }
  };

  const qualityInfo = getQualityAssessment();

  // 그래프 드래그 핸들러
  const handleChartMouseDown = (e) => {
    // e.activeLabel은 X축 데이터 값 (VG)
    if (e.activeLabel !== undefined) {
      setDragStartX(e.activeLabel);
      setIsDragging(true);
      setDragEndX(null); // 드래그 시작 시 끝점 초기화
      setCalculationResult(null); // 새 드래그 시작 시 이전 계산 결과 초기화
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
    // 차트 영역을 벗어나면 드래그 종료 (선택 해제)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* max-w-full로 변경하여 더 넓은 공간 확보 */}
      <div className="bg-white rounded-xl shadow-2xl max-w-full w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center">
            <Calculator className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">SS 값 수정</h2>
              <p className="text-sm text-gray-600">{sampleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* 현재 값 표시 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">현재 SS 값</h3>
            <div className="text-lg font-mono text-blue-600">
              {currentSS} mV/decade
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 왼쪽: 범위 설정 및 계산 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                선형 구간 선택
              </h3>

              {/* 추천 범위 버튼들 */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">🎯 추천 범위</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setRecommendedRange('switching')}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                  >
                    스위칭 (-1V ~ 1V)
                  </button>
                  <button
                    onClick={() => setRecommendedRange('subthreshold')}
                    className="px-2 py-1 bg-green-100 hover:bg-green-200 rounded transition-colors"
                  >
                    서브임계 (-2V ~ 2V)
                  </button>
                  <button
                    onClick={() => setRecommendedRange('negative')}
                    className="px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded transition-colors"
                  >
                    음의 영역만
                  </button>
                  <button
                    onClick={() => setRecommendedRange('positive')}
                    className="px-2 py-1 bg-orange-100 hover:bg-orange-200 rounded transition-colors"
                  >
                    양의 영역만
                  </button>
                   <button
                    onClick={() => setRecommendedRange('full')}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors col-span-2"
                  >
                    전체 범위
                  </button>
                </div>
              </div>

              {/* VG 범위 입력 */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 VG (V)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="-20"
                      max="20"
                      value={isNaN(startVG) ? '' : startVG.toString()} // NaN이면 빈 문자열로 표시
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '-') { // 빈 문자열이거나 '-'만 입력된 경우
                            setStartVG(NaN); // 잠시 NaN으로 설정 (유효하지 않음을 나타냄)
                        } else {
                            setStartVG(parseFloat(val));
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="-1.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 VG (V)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="-20"
                      max="20"
                      value={isNaN(endVG) ? '' : endVG.toString()} // NaN이면 빈 문자열로 표시
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '-') { // 빈 문자열이거나 '-'만 입력된 경우
                            setEndVG(NaN); // 잠시 NaN으로 설정
                        } else {
                            setEndVG(parseFloat(val));
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1.0"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>💡 선택 가이드:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Subthreshold 영역에서 선형성이 좋은 구간 선택</li>
                    <li>• 최소 3개 이상의 데이터 포인트 필요</li>
                    <li>• 음수 범위도 지원 (예: -3V ~ -1V)</li>
                    <li>• R² &gt; 0.9 목표로 범위 조정</li>
                  </ul>
                </div>

                <button
                  onClick={handleCalculate}
                  // startVG와 endVG가 NaN이거나 startVG가 endVG보다 크거나 같으면 버튼 비활성화
                  disabled={isCalculating || isNaN(startVG) || isNaN(endVG) || startVG >= endVG}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isCalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      계산 중...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      SS 계산
                    </>
                  )}
                </button>

                {/* 현재 선택된 범위 정보 */}
                {previewData.length > 0 && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>선택된 범위:</strong> {isNaN(startVG) ? 'N/A' : startVG.toFixed(1)}V ~ {isNaN(endVG) ? 'N/A' : endVG.toFixed(1)}V<br />
                    <strong>포함된 데이터:</strong> {pointsInCurrentRange}개 포인트
                  </div>
                )}
              </div>

              {/* 계산 결과 */}
              {calculationResult && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    계산 결과
                  </h4>

                  <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">새 SS:</span>
                        <div className="font-bold text-lg text-blue-700">
                          {calculationResult.ss.toFixed(1)} mV/decade
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">R²:</span>
                        <div className="font-bold text-lg text-green-700">
                          {calculationResult.rSquared.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">포인트:</span>
                        <div className="font-semibold">{calculationResult.dataPoints}개</div>
                      </div>
                      <div>
                        <span className="text-gray-600">범위:</span>
                        <div className="font-semibold">{calculationResult.range.startVG.toFixed(1)}V ~ {calculationResult.range.endVG.toFixed(1)}V</div>
                      </div>
                    </div>
                  </div>

                  {/* 품질 평가 */}
                  {qualityInfo && (
                    <div className={`p-3 rounded-lg ${qualityInfo.bgColor}`}>
                      <div className={`font-semibold ${qualityInfo.color} mb-1`}>
                        품질 평가: {qualityInfo.quality}
                      </div>
                      {qualityInfo.issues.length > 0 && (
                        <div className="text-sm">
                          <div className="flex items-center text-orange-600 mb-1">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            주의사항:
                          </div>
                          <ul className="text-orange-700 text-xs space-y-1">
                            {qualityInfo.issues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 오른쪽: 미리보기 그래프 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">데이터 미리보기 (드래그하여 범위 선택)</h3>

              {previewData.length > 0 ? (
                // h-[400px]로 높이 증가, user-select-none 추가
                <div className="h-[400px] bg-gray-50 rounded-lg p-4 cursor-crosshair user-select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={previewData}
                      onMouseDown={handleChartMouseDown}
                      onMouseMove={handleChartMouseMove}
                      onMouseUp={handleChartMouseUp}
                      onMouseLeave={handleChartMouseLeave}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="VG"
                        label={{ value: 'VG (V)', position: 'insideBottom', offset: -5 }}
                        type="number"
                        scale="linear"
                        domain={['dataMin', 'dataMax']}
                      />
                      <YAxis
                        label={{ value: 'log₁₀(ID)', angle: -90, position: 'insideLeft' }}
                        type="number"
                        scale="linear"
                        domain={['dataMin', 'dataMax']}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(3) : value,
                          name === 'logID' ? 'log₁₀(ID)' : name
                        ]}
                        labelFormatter={(value) => `VG: ${value}V`}
                      />
                      <Line
                        type="monotone"
                        dataKey="logID"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={(props) => {
                          const inCurrentRange = props.payload.VG >= currentSelectedMinVG && props.payload.VG <= currentSelectedMaxVG;
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={inCurrentRange ? 4 : 2}
                              fill={inCurrentRange ? "#EF4444" : "#3B82F6"}
                              stroke={inCurrentRange ? "#DC2626" : "#2563EB"}
                              strokeWidth={1}
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
                          fill="#8884d8"
                          fillOpacity={0.3}
                          strokeOpacity={0}
                        />
                      )}
                      {/* 최종 선택된 영역 표시 (드래그와 별개) */}
                       {!isDragging && (
                        <ReferenceArea
                          x1={currentSelectedMinVG}
                          x2={currentSelectedMaxVG}
                          fill="#EF4444"
                          fillOpacity={0.15}
                          stroke="#DC2626"
                          strokeWidth={1}
                        />
                       )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
                  표시할 데이터가 없습니다.
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    전체 데이터
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    선택된 범위 (드래그)
                  </div>
                </div>
                <div className="text-xs">
                  총 데이터: {previewData.length}개<br />
                  선택된 범위: {pointsInCurrentRange}개 포인트<br />
                  현재 범위: {isNaN(startVG) ? 'N/A' : startVG.toFixed(1)}V ~ {isNaN(endVG) ? 'N/A' : endVG.toFixed(1)}V
                </div>
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleApplyResult}
              disabled={!calculationResult}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              결과 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSRangeEditor;