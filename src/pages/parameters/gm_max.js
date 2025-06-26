export const calculateGmMax = (gmData) => {
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

  // 입력 데이터 유효성 검사
  if (!gmData || gmData.length === 0) return { value: 0, vg: 0 };
  
  // 이상치 제거 옵션 (필요시 주석 해제)
  // 노이즈가 심한 환경이나 자동화된 대량 분석시에만 사용 권장
  /*
  // ========== 통계적 이상치 제거 (Z-score 방법) ==========
  // 사용법: 아래 주석을 해제하고 gmData 대신 filteredData 사용
  
  let filteredData = gmData;
  
  // 1단계: 물리적 제약 (극단값 제거)
  // 목적: 측정 장비 오류나 계산 오류로 인한 명백히 잘못된 값들 제거
  const physicallyValid = gmData.filter(point => {
    return point.gm > 1e-15 &&          // 최소 gm 값 (1fS 미만은 노이즈)
           point.gm < 1e-3 &&           // 최대 gm 값 (1mS 이상은 비현실적)
           isFinite(point.gm) &&        // NaN, Infinity 제거
           point.gm > 0;                // 음수 gm 제거 (물리적으로 불가능)
  });
  
  // 2단계: Z-score 필터링 (데이터가 충분할 때만)
  // 목적: 평균에서 2.5 표준편차 이상 떨어진 통계적 이상치 제거
  if (physicallyValid.length >= 10) {
    const gmValues = physicallyValid.map(p => p.gm);
    const mean = gmValues.reduce((sum, val) => sum + val, 0) / gmValues.length;
    const variance = gmValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / gmValues.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 0) {
      const zScoreThreshold = 2.5; // 2.5σ 이상을 이상치로 간주 (약 1.2% 제외)
      filteredData = physicallyValid.filter(point => {
        const zScore = Math.abs(point.gm - mean) / stdDev;
        return zScore <= zScoreThreshold;
      });
      
      // 안전장치: 필터링으로 데이터가 너무 줄어들면 원본 사용
      if (filteredData.length < 5) {
        filteredData = physicallyValid;
      }
    }
  }
  
  // 3단계: 연속성 체크 (급격한 변화 감지)
  // 목적: VG가 연속적으로 변할 때 gm의 10배 이상 급격한 점프 감지
  if (filteredData.length >= 5) {
    const sorted = [...filteredData].sort((a, b) => a.VG - b.VG);
    const continuityFiltered = [];
    const maxJumpRatio = 10; // 10배 이상 급증/급감하는 포인트 제거
    
    for (let i = 0; i < sorted.length; i++) {
      let isValid = true;
      
      if (i > 0) {
        const prevGm = sorted[i-1].gm;
        const currentGm = sorted[i].gm;
        const jumpRatio = currentGm / prevGm;
        
        if (jumpRatio > maxJumpRatio || jumpRatio < 1/maxJumpRatio) {
          isValid = false;
        }
      }
      
      if (isValid) {
        continuityFiltered.push(sorted[i]);
      }
    }
    
    if (continuityFiltered.length >= 5) {
      filteredData = continuityFiltered;
    }
  }
  
  console.log(`이상치 제거: ${gmData.length}개 → ${filteredData.length}개 (${(filteredData.length/gmData.length*100).toFixed(1)}% 유지)`);
  
  // 이상치 제거를 사용하려면 아래 라인에서 gmData를 filteredData로 변경
  */
  
  // 🔍 gm 배열에서 최대값 찾기
  // reduce 함수를 사용하여 한 번의 순회로 최대값과 위치를 찾음
  // 💡 최소한의 안전장치: 유한한 양수 값만 고려
  const maxPoint = gmData.reduce((max, current) => {
    // 현재 점이 유효하고 (양수, 유한값) 더 크면 교체
    if (current.gm > 0 && isFinite(current.gm) && current.gm > max.gm) {
      return current;
    }
    return max;
  }, { gm: 0, VG: 0 }); // 초기값 설정
  
  // 📊 결과 반환: 최대값과 해당 게이트 전압
  return { 
    value: maxPoint.gm,    // gm_max 값 (S)
    vg: maxPoint.VG        // gm_max가 발생하는 게이트 전압 (V)
  };
};