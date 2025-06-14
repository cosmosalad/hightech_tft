
/**
 * 🔌 Ron (On-Resistance) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - 소자가 완전히 켜진 선형 영역에서 작동할 때의 총 저항
 * - 전력 손실과 직접 관련 (P = I²R)
 * - 낮은 Ron → 높은 전류 구동 능력, 낮은 전력 손실
 * 
 * 📏 측정 데이터: IDVD
 * - 각각 다른 VG 바이어스에 해당하는 ID-VD 곡선들
 * 
 * 🧮 계산 방법:
 * - 가장 높은 VG에서 ID-VD 곡선의 초반 선형 영역 분석
 * - 선형 구간의 기울기 = 1/Ron (컨덕턴스)
 * - 따라서: Ron = 1/slope
 * 
 * 📊 선형 영역: 일반적으로 VD = 1~5V 구간 (옴의 법칙 적용)
 */

import { linearRegression } from './utils.js';

export const calculateRon = (chartData, gateVoltages) => {
  // 입력 데이터 유효성 검사
  if (!chartData || !gateVoltages || gateVoltages.length === 0) return 0;
  
  // 🎯 최고 게이트 전압에서의 데이터 선택
  // Ron은 소자가 가장 강하게 켜진 상태에서 측정
  const highestVG = gateVoltages[gateVoltages.length - 1];
  const dataKey = `VG_${highestVG}V`;  // 해당 VG의 데이터 컬럼명
  
  // 📊 초반 선형 구간 선택 (1~5번째 점)
  // VD = 0V는 제외하고 낮은 VD 영역에서 선형성 확보
  const linearPoints = chartData.slice(1, 6);
  if (linearPoints.length < 3) return 0;  // 최소 3개 점 필요
  
  // 📐 선형 회귀를 위한 데이터 준비
  const vd = linearPoints.map(p => p.VD);           // 드레인 전압 (독립변수)
  const id = linearPoints.map(p => p[dataKey] || 1e-12);  // 드레인 전류 (종속변수)
  
  // 🧮 선형 회귀로 기울기 계산
  // ID = slope × VD + intercept (옴의 법칙: V = IR → I = V/R)
  const slope = linearRegression(vd, id).slope;
  
  // ⚡ Ron 계산: Ron = 1/slope
  // 기울기 = dID/dVD = 1/R (컨덕턴스)
  // 따라서: Ron = 1/(dID/dVD) = dVD/dID
  return slope > 0 ? 1 / slope : 0;
};