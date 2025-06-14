/**
 * 🧮 TFT 계산을 위한 핵심 유틸리티 함수들
 * 
 * 이 모듈은 모든 TFT 파라미터 계산의 기반이 되는 함수들을 제공합니다.
 * - 선형 회귀: 모든 외삽법의 기초
 * - Cox 계산: 이동도 계산의 핵심
 * - 물리 상수: 정확한 계산을 위한 표준값들
 */

/**
 * 📐 Linear Regression (선형 회귀) 함수
 * 
 * 📖 물리적 의미:
 * - 두 변수 간의 선형 관계를 수학적으로 모델링
 * - TFT 분석에서 외삽법(extrapolation)의 기초
 * - Y-function, Vth 계산, SS 분석 등에 필수
 * 
 * 🧮 수식: y = mx + b
 * - m (기울기): (nΣxy - ΣxΣy) / (nΣx² - (Σx)²)
 * - b (y절편): (Σy - mΣx) / n
 * 
 * @param {Array} x - 독립변수 배열
 * @param {Array} y - 종속변수 배열  
 * @returns {Object} { slope: 기울기, intercept: y절편 }
 */
export const linearRegression = (x, y) => {
  const n = x.length;                                    // 데이터 포인트 개수
  const sumX = x.reduce((a, b) => a + b, 0);            // Σx
  const sumY = y.reduce((a, b) => a + b, 0);            // Σy
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);  // Σxy
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);       // Σx²
  
  // 🧮 최소자승법으로 기울기와 절편 계산
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
};

/**
 * 📏 Cox (Gate Capacitance) 계산 함수
 * 
 * 📖 물리적 의미:
 * - 게이트 산화막의 단위 면적당 정전용량
 * - 게이트 전압이 채널을 제어하는 효율성을 결정
 * - 모든 이동도 계산의 핵심 파라미터
 * 
 * 🧮 수식: Cox = (ε₀ × εᵣ) / tox
 * - ε₀: 진공 유전율 (8.854×10⁻¹² F/m)
 * - εᵣ: 상대 유전율 (SiO₂ = 3.9)
 * - tox: 산화막 두께 (m)
 * 
 * @param {number} tox - 산화막 두께 (m)
 * @returns {number} Cox 값 (F/m²)
 */
export const calculateCox = (tox) => {
  const epsilon_0 = 8.854e-12;  // 진공 유전율 (F/m)
  const epsilon_r = 3.9;        // SiO₂ 상대 유전율 (무차원)
  
  // 🧮 Cox 계산: Cox = (ε₀ × εᵣ) / tox
  return (epsilon_0 * epsilon_r) / tox;
};

/**
 * 🔬 물리 상수 정의
 * 
 * 📖 용도:
 * - 정확하고 일관된 물리 계산을 위한 표준 상수값들
 * - Dit, SS, 열전압 계산 등에 사용
 * - 국제 표준(SI) 기준값 사용
 */
export const CONSTANTS = {
  // 기본 물리 상수
  EPSILON_0: 8.854e-12,        // 진공 유전율 (F/m)
  EPSILON_R_SIO2: 3.9,         // SiO₂ 상대 유전율 (무차원)
  ELEMENTARY_CHARGE: 1.602e-19, // 기본 전하량 (C)
  BOLTZMANN: 1.380649e-23,     // 볼츠만 상수 (J/K)
  
  // 표준 측정 조건
  ROOM_TEMP: 300               // 실온 (K) = 27°C
};