import React, { useState, useEffect } from 'react';
import { X, Calculator, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateSS } from '../parameters/ss.js';

const SSRangeEditor = ({ 
  isOpen, 
  onClose, 
  chartData, 
  currentSS, 
  sampleName,
  onApplyResult 
}) => {
  const [startVG, setStartVG] = useState('-1.0'); // 문자열로 관리
  const [endVG, setEndVG] = useState('1.0');     // 문자열로 관리
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // 초기값 설정 및 미리보기 데이터 생성
  useEffect(() => {
    if (isOpen && chartData && chartData.length > 0) {
      // VG 범위 초기화 (전체 범위의 중간 부분)
      const vgValues = chartData.map(d => d.VG).sort((a, b) => a - b);
      const minVG = Math.min(...vgValues);
      const maxVG = Math.max(...vgValues);
      
      // 기본값: 전체 범위의 30-70% 구간
      const startValue = Math.round((minVG + (maxVG - minVG) * 0.3) * 10) / 10;
      const endValue = Math.round((minVG + (maxVG - minVG) * 0.7) * 10) / 10;
      
      // ✅ 문자열로 변환해서 설정
      setStartVG(startValue.toString());
      setEndVG(endValue.toString());
      
      console.log(`Initial VG range: ${startValue}V to ${endValue}V`);
    }
  }, [isOpen, chartData]);

  // 미리보기 데이터 생성 (수정된 버전)
  const generatePreviewData = () => {
    if (!chartData) return;
    
    // ✅ 입력값을 숫자로 변환
    const numericStartVG = parseFloat(startVG);
    const numericEndVG = parseFloat(endVG);
    
    // 유효하지 않은 입력값 처리
    if (isNaN(numericStartVG) || isNaN(numericEndVG)) {
      console.warn('Invalid VG range values:', startVG, endVG);
      setPreviewData([]);
      return;
    }
    
    const preview = chartData.map(d => ({
      VG: d.VG,
      logID: Math.log10(Math.abs(d.ID)),
      inRange: d.VG >= numericStartVG && d.VG <= numericEndVG, // ✅ 숫자로 비교
      ID: d.ID
    })).filter(d => isFinite(d.logID));
    
    const pointsInRange = preview.filter(p => p.inRange).length;
    console.log(`Range: ${numericStartVG}V to ${numericEndVG}V, Points in range: ${pointsInRange}`);
    
    setPreviewData(preview);
  };

  // VG 범위 변경 시 미리보기 업데이트
  useEffect(() => {
    generatePreviewData();
  }, [startVG, endVG, chartData]);

  // SS 계산 실행
  const handleCalculate = () => {
    const numericStartVG = parseFloat(startVG);
    const numericEndVG = parseFloat(endVG);

    if (!chartData || isNaN(numericStartVG) || isNaN(numericEndVG) || numericStartVG >= numericEndVG) {
      alert('유효하지 않은 VG 범위입니다.');
      return;
    }

    setIsCalculating(true);
    
    try {
      // 선택된 범위의 데이터 필터링
      const selectedData = chartData.filter(d => 
        d.VG >= numericStartVG && d.VG <= numericEndVG
      );

      if (selectedData.length < 3) {
        alert('선택된 범위에 데이터가 부족합니다 (최소 3개 점 필요).');
        setIsCalculating(false);
        return;
      }

      // SS 계산
      const ssResult = calculateSS(chartData, { 
        customRange: true, 
        startVG: numericStartVG, 
        endVG: numericEndVG 
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

      // 선형 회귀로 R² 계산
      const x = logData.map(d => d.VG);
      const y = logData.map(d => d.logID);
      const n = x.length;
      
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // R² 계산
      const yMean = sumY / n;
      const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
      const ssResidual = x.reduce((sum, xi, i) => {
        const predicted = slope * xi + intercept;
        return sum + Math.pow(y[i] - predicted, 2);
      }, 0);
      
      const rSquared = Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal)));

      setCalculationResult({
        ss: ssResult,
        rSquared: rSquared,
        dataPoints: logData.length,
        slope: slope,
        intercept: intercept,
        range: { startVG: numericStartVG, endVG: numericEndVG }
      });

      console.log(`SS calculation completed: ${ssResult.toFixed(1)} mV/decade, R² = ${rSquared.toFixed(3)}`);

    } catch (error) {
      console.error('SS 계산 오류:', error);
      alert('계산 중 오류가 발생했습니다.');
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
    
    let quality = '미흡';
    let color = 'text-red-600';
    let bgColor = 'bg-red-50';
    let issues = [];
    
    if (rSquared >= 0.95 && dataPoints >= 10 && ss < 1000) {
      quality = '우수';
      color = 'text-green-600';
      bgColor = 'bg-green-50';
    } else if (rSquared >= 0.90 && dataPoints >= 8 && ss < 1500) {
      quality = '양호';
      color = 'text-blue-600';
      bgColor = 'bg-blue-50';
    } else if (rSquared >= 0.85 && dataPoints >= 5) {
      quality = '보통';
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-50';
    }
    
    if (rSquared < 0.85) issues.push('낮은 선형성 (R² < 0.85)');
    if (dataPoints < 5) issues.push('데이터 포인트 부족');
    if (ss > 1000) issues.push('높은 SS 값 (> 1V/decade)');
    
    return { quality, color, bgColor, issues };
  };

  // 추천 범위 설정 함수
  const setRecommendedRange = (type) => {
    if (!chartData) return;
    
    const vgValues = chartData.map(d => d.VG).sort((a, b) => a - b);
    const minVG = Math.min(...vgValues);
    const maxVG = Math.max(...vgValues);
    
    switch (type) {
      case 'subthreshold':
        setStartVG('-2.0');
        setEndVG('2.0');
        break;
      case 'switching':
        setStartVG('-1.0');
        setEndVG('1.0');
        break;
      case 'negative':
        setStartVG(Math.max(minVG, -3).toString());
        setEndVG('0.0');
        break;
      case 'positive':
        setStartVG('0.0');
        setEndVG(Math.min(maxVG, 3).toString());
        break;
      default:
        break;
    }
  };

  const qualityInfo = getQualityAssessment();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
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
                      value={startVG}
                      onChange={(e) => setStartVG(e.target.value)}
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
                      value={endVG}
                      onChange={(e) => setEndVG(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1.0"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>💡 선택 가이드:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Subthreshold 영역에서 선형성이 좋은 구간 선택</li>
                    <li>• 최소 5개 이상의 데이터 포인트 필요</li>
                    <li>• 음수 범위도 지원 (예: -3V ~ -1V)</li>
                    <li>• R² &gt; 0.9 목표로 범위 조정</li>
                  </ul>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={isCalculating || parseFloat(startVG) >= parseFloat(endVG)} // ✅ 숫자로 비교
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
                    <strong>선택된 범위:</strong> {startVG}V ~ {endVG}V<br />
                    <strong>포함된 데이터:</strong> {previewData.filter(d => d.inRange).length}개 포인트
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
                        <div className="font-semibold">{startVG}V ~ {endVG}V</div>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">데이터 미리보기</h3>
              
              {previewData.length > 0 && (
                <div className="h-80 bg-gray-50 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={previewData}>
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
                          const isInRange = previewData[props.payload?.index]?.inRange;
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={isInRange ? 4 : 2}
                              fill={isInRange ? "#EF4444" : "#3B82F6"}
                              stroke={isInRange ? "#DC2626" : "#2563EB"}
                              strokeWidth={1}
                            />
                          );
                        }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                    선택된 범위
                  </div>
                </div>
                <div className="text-xs">
                  총 데이터: {previewData.length}개<br />
                  선택된 범위: {previewData.filter(d => d.inRange).length}개 포인트<br />
                  현재 범위: {startVG}V ~ {endVG}V
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