// 🔥 개선된 파일 타입 감지 - 실제 측정 파일명 패턴 반영
export const detectFileType = (filename) => {
  const name = filename.toLowerCase();
  
  // IDVD 패턴 감지
  if (name.includes('idvd')) {
    return 'IDVD';
  }
  
  // Hysteresis 패턴 감지 (가장 구체적인 것부터)
  if (name.includes('idvg') && 
      (name.includes('linear') || name.includes('lin')) && 
      (name.includes('hys') || name.includes('hysteresis')) || 
      (name.includes('hys') || name.includes('hysteresis'))) {
    return 'IDVG-Hysteresis';
  }
  
  // Linear 패턴 감지
  if (name.includes('idvg') && 
      (name.includes('linear') || name.includes('lin'))) {
    return 'IDVG-Linear';
  }
  
  // Saturation 패턴 감지
  if (name.includes('idvg') && 
      (name.includes('sat') || name.includes('saturation'))) {
    return 'IDVG-Saturation';
  }
  
  // 추가 패턴들 (실제 측정에서 사용되는 패턴)
  if (name.includes('dk') && name.includes('tft')) {
    if (name.includes('idvd')) return 'IDVD';
    if (name.includes('idvg_vd_linear') && name.includes('hys')) return 'IDVG-Hysteresis';
    if (name.includes('idvg_vd_linear')) return 'IDVG-Linear';
    if (name.includes('idvg_vd_sat')) return 'IDVG-Saturation';
  }
  
  return 'Unknown';
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일 확장자 검증
export const isValidExcelFile = (filename) => {
  const validExtensions = ['.xls', '.xlsx'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validExtensions.includes(extension);
};

// 🔥 개선된 샘플명 생성 - 더 지능적인 추출
export const generateSampleName = (filename) => {
  // 확장자 제거
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // 일반적인 패턴들 제거
  let sampleName = nameWithoutExt
    .replace(/DKTFT/gi, '')
    .replace(/TFT/gi, '')
    .replace(/IDVD|IDVG|Linear|Saturation|Hys|Hysteresis/gi, '')
    .replace(/VD_Linear|VD_Sat/gi, '')
    .replace(/[_-]+/g, '_')
    .replace(/^_|_$/g, '');
  
  // 숫자만 남은 경우 (예: 10711) - 날짜나 샘플 번호로 추정
  if (/^\d+$/.test(sampleName)) {
    return `Sample_${sampleName}`;
  }
  
  // 빈 문자열인 경우 원본 파일명 사용
  if (!sampleName) {
    return nameWithoutExt;
  }
  
  return sampleName;
};

// 파일 타입별 아이콘 반환
export const getFileTypeIcon = (fileType) => {
  switch (fileType) {
    case 'IDVD':
      return '📊';
    case 'IDVG-Linear':
      return '📈';
    case 'IDVG-Saturation':
      return '📉';
    case 'IDVG-Hysteresis':
      return '🔄';
    default:
      return '📄';
  }
};

// 파일 타입별 색상 반환
export const getFileTypeColor = (fileType) => {
  switch (fileType) {
    case 'IDVD':
      return 'bg-purple-100 text-purple-800';
    case 'IDVG-Linear':
      return 'bg-blue-100 text-blue-800';
    case 'IDVG-Saturation':
      return 'bg-green-100 text-green-800';
    case 'IDVG-Hysteresis':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 🔥 파일 타입별 설명 추가
export const getFileTypeDescription = (fileType) => {
  switch (fileType) {
    case 'IDVD':
      return 'ID-VD 특성 측정 (출력 특성, Ron 계산용)';
    case 'IDVG-Linear':
      return 'ID-VG Linear 측정 (gm, μFE, Ion/Ioff 계산용)';
    case 'IDVG-Saturation':
      return 'ID-VG Saturation 측정 (Vth, SS, Dit 계산용)';
    case 'IDVG-Hysteresis':
      return 'ID-VG Hysteresis 측정 (안정성, ΔVth 평가용)';
    default:
      return '알 수 없는 파일 타입';
  }
};

// 🔥 파일명 검증 및 제안
export const validateAndSuggestFilename = (filename) => {
  const detectedType = detectFileType(filename);
  const suggestions = [];
  
  if (detectedType === 'Unknown') {
    suggestions.push('파일명에 측정 타입이 명확하지 않습니다.');
    suggestions.push('예시: Sample1_IDVD.xlsx, Sample1_IDVG_Linear.xlsx');
  }
  
  const name = filename.toLowerCase();
  
  // 일반적인 명명 규칙 체크
  if (!name.includes('idvg') && !name.includes('idvd')) {
    suggestions.push('파일명에 IDVG 또는 IDVD를 포함해주세요.');
  }
  
  if (name.includes('idvg') && !name.includes('linear') && !name.includes('sat') && !name.includes('hys')) {
    suggestions.push('IDVG 파일은 Linear, Saturation, 또는 Hysteresis를 명시해주세요.');
  }
  
  return {
    isValid: detectedType !== 'Unknown',
    detectedType,
    suggestions
  };
};