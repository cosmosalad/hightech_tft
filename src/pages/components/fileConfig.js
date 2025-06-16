// fileConfig.js - GitHub 파일 목록 설정 파일 (최종 수정 버전)

// GitHub 기본 설정
export const GITHUB_CONFIG = {
  username: 'cosmosalad',
  repo: 'hightech_tft',
  branch: 'main'
};

// 폴더별 파일 목록 설정
export const FOLDER_FILES = {
  '2023sample': [
    '0711_TFT_IDVD_IZO25nm.xls',
    '0711_TFT_IDVG_Linear_Hys_IZO25nm.xls',
    '0711_TFT_IDVG_Linear_IZO25nm.xls',
    '0711_TFT_IDVG_Sat_IZO25nm.xls'
  ],
  '공통': [
    '0614_IDVG_Linear_0sccm_300.xls',
    '0614_IDVG_Linear_0sccm_350.xls',
    '0614_IDVG_Linear_1sccm_0.xls',
    '0614_IDVG_Linear_1sccm_50.xls',
    '0614_IDVG_Linear_1sccm_100.xls',
    '0614_IDVG_Linear_1sccm_150.xls',
    '0614_IDVG_Linear_1sccm_200.xls',
    '0614_IDVG_Linear_1sccm_300.xls',
    '0616_IDVD_1sccm_0.xls',
    '0616_IDVD_1sccm_100.xls',
    '0616_IDVD_1sccm_200.xls',
    '0616_IDVD_1sccm_300.xls',
    '0616_IDVG_Lin_1sccm_0.xls',
    '0616_IDVG_Lin_1sccm_100.xls',
    '0616_IDVG_Lin_1sccm_200.xls',
    '0616_IDVG_Lin_1sccm_300.xls',
    '0616_IDVG_Lin_Hys_1sccm_0.xls',
    '0616_IDVG_Lin_Hys_1sccm_100.xls',
    '0616_IDVG_Lin_Hys_1sccm_200.xls',
    '0616_IDVG_Lin_Hys_1sccm_300.xls',
    '0616_IDVG_Sat_1sccm_anneal0.xls',
    '0616_IDVG_Sat_1sccm_anneal100.xls',
    '0616_IDVG_Sat_1sccm_anneal200.xls',
    '0616_IDVG_Sat_1sccm_anneal300.xls'
  ],
  '1조': [
  ],
  '5조': [
  ]
};

// 파일 타입 감지 함수
export const detectFileType = (filename) => {
  const name = filename.toLowerCase();
  
  if (name.includes('idvd')) {
    return 'IDVD';
  }
  
  if (name.includes('idvg') && 
      (name.includes('linear') || name.includes('lin')) && 
      (name.includes('hys') || name.includes('hysteresis'))) {
    return 'IDVG-Hysteresis';
  }
  
  if (name.includes('idvg') && 
      (name.includes('linear') || name.includes('lin'))) {
    return 'IDVG-Linear';
  }
  
  if (name.includes('idvg') && 
      (name.includes('sat') || name.includes('saturation'))) {
    return 'IDVG-Saturation';
  }
  
  return 'Unknown';
};

// 샘플명 자동 생성 함수 - 파일 타입 패턴 이후 부분을 샘플명으로 추출
export const generateSampleName = (filename) => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const nameLower = nameWithoutExt.toLowerCase();
  
  // 파일 타입별 패턴 정의 (우선순위 순서: 더 구체적인 것부터)
  const patterns = [
    {
      // IDVG-Hysteresis: IDVG + Linear + Hys 모두 포함
      type: 'IDVG-Hysteresis',
      keywords: ['idvg', 'linear', 'hys'],
      regex: /^(.+?)_idvg.*?linear.*?hys_(.+)$/i
    },
    {
      // IDVG-Linear: IDVG + (Linear 또는 Lin) 포함 (Hys 제외)
      type: 'IDVG-Linear', 
      keywords: ['idvg', 'linear'],
      regex: /^(.+?)_idvg.*?(?:linear|lin)_(.+)$/i,
      exclude: ['hys']
    },
    {
      // IDVG-Saturation: IDVG + Sat 포함
      type: 'IDVG-Saturation',
      keywords: ['idvg', 'sat'],
      regex: /^(.+?)_idvg.*?sat.*?_(.+)$/i
    },
    {
      // IDVD: IDVD 포함
      type: 'IDVD',
      keywords: ['idvd'],
      regex: /^(.+?)_idvd_(.+)$/i
    }
  ];
  
  // 각 패턴을 순서대로 확인
  for (const pattern of patterns) {
    // 필수 키워드가 모두 포함되어 있는지 확인
    const hasAllKeywords = pattern.keywords.every(keyword => 
      nameLower.includes(keyword)
    );
    
    // 제외 키워드가 있는지 확인
    const hasExcludeKeywords = pattern.exclude ? 
      pattern.exclude.some(keyword => nameLower.includes(keyword)) : false;
    
    if (hasAllKeywords && !hasExcludeKeywords) {
      // 정규식으로 샘플명 추출 시도
      const match = nameWithoutExt.match(pattern.regex);
      if (match && match[2]) {
        return match[2]; // 샘플명 부분 반환
      }
      
      // 정규식 매치 실패 시 키워드 기반 추출
      const parts = nameWithoutExt.split('_');
      const lastKeywordIndex = Math.max(
        ...pattern.keywords.map(keyword => {
          const index = parts.findIndex(part => 
            part.toLowerCase().includes(keyword)
          );
          return index;
        })
      );
      
      if (lastKeywordIndex >= 0 && lastKeywordIndex < parts.length - 1) {
        return parts.slice(lastKeywordIndex + 1).join('_');
      }
    }
  }
  
  // 패턴 매치 실패 시 전체 파일명 반환
  return nameWithoutExt;
};

// 파일 타입별 아이콘
export const getFileTypeIcon = (fileType) => {
  switch (fileType) {
    case 'IDVD': return '📊';
    case 'IDVG-Linear': return '📈';
    case 'IDVG-Saturation': return '📉';
    case 'IDVG-Hysteresis': return '🔄';
    default: return '📄';
  }
};

// 파일 타입별 색상
export const getFileTypeColor = (fileType) => {
  switch (fileType) {
    case 'IDVD': return 'bg-purple-100 text-purple-800';
    case 'IDVG-Linear': return 'bg-blue-100 text-blue-800';
    case 'IDVG-Saturation': return 'bg-green-100 text-green-800';
    case 'IDVG-Hysteresis': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// 새로운 파일을 추가하는 헬퍼 함수 (개발용)
export const addFileToFolder = (folderName, filename) => {
  if (FOLDER_FILES[folderName]) {
    if (!FOLDER_FILES[folderName].includes(filename)) {
      FOLDER_FILES[folderName].push(filename);
      console.log(`파일 "${filename}"이 "${folderName}" 폴더에 추가되었습니다.`);
    } else {
      console.log(`파일 "${filename}"은 이미 "${folderName}" 폴더에 존재합니다.`);
    }
  } else {
    console.log(`폴더 "${folderName}"이 존재하지 않습니다.`);
  }
};

// 파일을 제거하는 헬퍼 함수 (개발용)
export const removeFileFromFolder = (folderName, filename) => {
  if (FOLDER_FILES[folderName]) {
    const index = FOLDER_FILES[folderName].indexOf(filename);
    if (index > -1) {
      FOLDER_FILES[folderName].splice(index, 1);
      console.log(`파일 "${filename}"이 "${folderName}" 폴더에서 제거되었습니다.`);
    } else {
      console.log(`파일 "${filename}"을 "${folderName}" 폴더에서 찾을 수 없습니다.`);
    }
  } else {
    console.log(`폴더 "${folderName}"이 존재하지 않습니다.`);
  }
};