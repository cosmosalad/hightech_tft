/**
 * 📈 gm_max (Maximum Transconductance) 계산 모듈
 * 
 * 📖 물리적 의미:
 * - gm의 최대값으로, 드레인 전류를 제어하는 게이트의 최대 효율을 나타냄
 * - 종종 증폭을 위한 최적의 동작점을 나타냄
 * - TFT의 성능 평가에서 핵심 지표 중 하나
 * 
 * 📏 측정 데이터: IDVG-Linear
 * - gm 배열에서 최대값을 찾는 간단한 연산
 * - gm_max가 발생하는 VG 지점도 함께 기록
 * 
 * 🧮 계산 방법: 
 * - gm 배열을 순회하며 최대값과 그 위치를 찾음
 * - 결과: { value: gm_max 값, vg: 해당 VG 값 }
 * 
 * 💡 응용:
 * - μFE (Field-Effect Mobility) 계산의 핵심 입력값
 * - Vth (Threshold Voltage) 계산 시 기준점
 * - 소자의 최적 동작점 결정
 */

export const calculateGmMax = (gmData) => {
  // 입력 데이터 유효성 검사
  if (!gmData || gmData.length === 0) return { value: 0, vg: 0 };
  
  // 🔍 gm 배열에서 최대값 찾기
  // reduce 함수를 사용하여 한 번의 순회로 최대값과 위치를 찾음
  const maxPoint = gmData.reduce((max, current) => 
    current.gm > max.gm ? current : max  // 현재 gm이 더 크면 교체
  );
  
  // 📊 결과 반환: 최대값과 해당 게이트 전압
  return { 
    value: maxPoint.gm,    // gm_max 값 (S)
    vg: maxPoint.VG        // gm_max가 발생하는 게이트 전압 (V)
  };
};