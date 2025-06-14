/**
 * ⚡ SS (Subthreshold Swing) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 게이트 전압이 소자를 오프→온 상태로 얼마나 효과적으로 전환하는지 정량화
 * - 드레인 전류를 10배(1 decade) 변화시키는 데 필요한 게이트 전압 스윙
 * - 이상적인 SS = 60mV/dec (실온에서)
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - 드레인 전압: 0.1V (일정)
 * - Subthreshold 영역(스위칭 구간)의 기울기 분석
 * 
 * 🧮 계산 수식: SS = dVG/d(log₁₀ID) = 1/slope × 1000 (mV/decade)
 * - log₁₀(ID) vs VG 그래프에서 선형 구간의 기울기의 역수
 * - 기울기가 클수록(가파를수록) SS가 작음 → 좋은 스위칭
 * 
 * 📊 품질 기준:
 * - < 100 mV/dec: 우수
 * - 100~300 mV/dec: 양호  
 * - 300~1000 mV/dec: 보통
 * - > 1000 mV/dec: 불량
 */

import { linearRegression } from './utils.js';

export const calculateSS = (chartData) => {
  // 입력 데이터 유효성 검사 (최소 10개 점 필요)
  if (!chartData || chartData.length < 10) return 0;
  
  // 📊 Step 1: log₁₀(ID) 변환
  // ID 값에 로그를 취하고 유한한 값만 필터링
  const logData = chartData.map(d => ({
    VG: d.VG,
    logID: Math.log10(Math.abs(d.ID))  // 절대값 사용 (음수 방지)
  })).filter(d => isFinite(d.logID));  // NaN, Infinity 제거
  
  if (logData.length < 5) return 0;  // 최소 데이터 확보
  
  // 🎯 Step 2: 최적 스위칭 구간 선택
  // 우선순위: 스위칭 구간 → Subthreshold 구간 → 전체 중간 구간
  
  // Option 1: 스위칭 구간 (-1V ~ +1V) - 가장 정확
  const switchingData = logData.filter(d => d.VG >= -1 && d.VG <= 1);
  
  // Option 2: Subthreshold 구간 (전류 범위 기준)
  const subthresholdData = logData.filter(d => d.logID > -12 && d.logID < -6);
  
  // Option 3: 전체 데이터의 중간 구간
  const start = Math.floor(logData.length * 0.3);
  const end = Math.floor(logData.length * 0.7);
  const middleData = logData.slice(start, end);
  
  // 🔍 데이터 선택 우선순위
  let selectedData;
  if (switchingData.length >= 10) {
    selectedData = switchingData;        // 스위칭 구간 우선
  } else if (subthresholdData.length >= 5) {
    selectedData = subthresholdData;     // Subthreshold 구간
  } else {
    selectedData = middleData;           // 중간 구간 (fallback)
  }
  
  // 📐 Step 3: 선형 회귀로 기울기 계산
  const x = selectedData.map(d => d.VG);      // 게이트 전압 (독립변수)
  const y = selectedData.map(d => d.logID);   // log₁₀(ID) (종속변수)
  const { slope } = linearRegression(x, y);
  
  // 🧮 Step 4: SS 계산
  // SS = 1/slope (V/decade) → mV/decade 변환
  return slope > 0 ? (1 / slope) * 1000 : 0;
};