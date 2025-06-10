// 파일 타입 감지
export const detectFileType = (filename) => {
  const name = filename.toLowerCase();
  if (name.includes('idvd')) return 'IDVD';
  if (name.includes('idvg') && (name.includes('linear') || name.includes('lin')) && (name.includes('hys') || name.includes('hysteresis'))) return 'IDVG-Hysteresis';
  if (name.includes('idvg') && (name.includes('linear') || name.includes('lin'))) return 'IDVG-Linear';
  if (name.includes('idvg') && name.includes('sat')) return 'IDVG-Saturation';
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

// 샘플명 생성 도우미
export const generateSampleName = (filename) => {
  // 확장자 제거
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // 공통 패턴 제거하여 샘플명 추출
  let sampleName = nameWithoutExt
    .replace(/DKTFT/gi, '')
    .replace(/IDVD|IDVG|Linear|Saturation|Hys|Hysteresis/gi, '')
    .replace(/[_-]+/g, '_')
    .replace(/^_|_$/g, '');
  
  return sampleName || nameWithoutExt;
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