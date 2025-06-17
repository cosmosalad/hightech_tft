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
    '0614_IDVG_Lin_0sccm_300.xls',
    '0614_IDVG_Lin_0sccm_350.xls',
    '0614_IDVG_Lin_1sccm_000.xls',
    '0614_IDVG_Lin_1sccm_050.xls',
    '0614_IDVG_Lin_1sccm_100.xls',
    '0614_IDVG_Lin_1sccm_150.xls',
    '0614_IDVG_Lin_1sccm_200.xls',
    '0614_IDVG_Lin_1sccm_300.xls',
    '0616_IDVD_1sccm_000.xls',
    '0616_IDVD_1sccm_100.xls',
    '0616_IDVD_1sccm_200.xls',
    '0616_IDVD_1sccm_300.xls',
    '0616_IDVG_Lin_1sccm_000.xls',
    '0616_IDVG_Lin_1sccm_100.xls',
    '0616_IDVG_Lin_1sccm_200.xls',
    '0616_IDVG_Lin_1sccm_300.xls',
    '0616_IDVG_Lin_Hys_1sccm_000.xls',
    '0616_IDVG_Lin_Hys_1sccm_100.xls',
    '0616_IDVG_Lin_Hys_1sccm_200.xls',
    '0616_IDVG_Lin_Hys_1sccm_300.xls',
    '0616_IDVG_Sat_1sccm_000.xls',
    '0616_IDVG_Sat_1sccm_100.xls',
    '0616_IDVG_Sat_1sccm_200.xls',
    '0616_IDVG_Sat_1sccm_300.xls'
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

// 샘플명 자동 생성 함수 - 파일명에서 타입 키워드를 제거하여 샘플명 생성
export const generateSampleName = (filename) => {
  // 1. 파일명에서 확장자를 제거합니다.
  let sampleName = filename.replace(/\.[^/.]+$/, "");
  
  // 2. 제거할 측정 타입 관련 키워드 목록을 정의합니다.
  const keywords = [
    'IDVG', 'Linear', 'Lin', 
    'Saturation', 'Sat', 
    'Hysteresis', 'Hys', 
    'IDVD'
  ];

  // 3. 각 키워드를 파일명에서 찾아 제거합니다.
  //    대소문자 구분을 하지 않고, 키워드 앞이나 뒤의 언더스코어(_)를 포함하여 처리합니다.
  //    예: "0616_IDVG_Lin_1sccm_100" -> "0616__1sccm_100"
  keywords.forEach(keyword => {
    const regex = new RegExp(`_?${keyword}_?`, 'ig');
    sampleName = sampleName.replace(regex, '_');
  });
  
  // 4. 키워드 제거 후 발생할 수 있는 연속된 언더스코어("__")를 하나로 합칩니다.
  //    예: "0616__1sccm_100" -> "0616_1sccm_100"
  sampleName = sampleName.replace(/__+/g, '_');
  
  // 5. 파일명의 시작이나 끝에 언더스코어가 남았다면 제거합니다.
  sampleName = sampleName.replace(/^_|_$/g, '');

  return sampleName;
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