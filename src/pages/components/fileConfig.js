export const GITHUB_CONFIG = {
  username: 'cosmosalad',
  repo: 'hightech_tft',
  branch: 'main'
};

let FOLDER_STRUCTURE_DATA = null;

export const loadFolderStructure = async () => {
  if (FOLDER_STRUCTURE_DATA) {
    console.log("Folder structure already loaded. Returning cached data.");
    return FOLDER_STRUCTURE_DATA;
  }
  try {
    const githubRawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/public/folderStructureData.json`;
    console.log(`Attempting to load folderStructureData.json from: ${githubRawUrl}`);

    const response = await fetch(githubRawUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to load folder structure: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to load folder structure: ${response.status} ${response.statusText}`);
    }

    FOLDER_STRUCTURE_DATA = await response.json();
    console.log("Folder structure loaded successfully:", FOLDER_STRUCTURE_DATA);
    return FOLDER_STRUCTURE_DATA;
  } catch (error) {
    console.error("Error loading folder structure:", error);
    return null;
  }
};

export const getFilesFromPath = (folderPath) => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = FOLDER_STRUCTURE_DATA;

  for (const part of pathParts) {
    if (current && current[part]) { current = current[part];
      if (current.children) {
        current = current.children;
      }
    } else {
      return [];
    }
  }

  return current && current.files || [];
};

export const getAllFolderPaths = () => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const paths = [];

  const traverse = (obj, currentPath = '') => {
    if (!obj)
      return;
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      if (item.type === 'folder') {
        paths.push(newPath);

        if (item.children) {
          traverse(item.children, newPath);
        }
      }
    });
  };

  traverse(FOLDER_STRUCTURE_DATA);
  return paths;
};

export const getFolderTree = () => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const buildTree = (obj, currentPath = '', level = 0) => {
    if (!obj)
      return [];
    return Object.keys(obj).map(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      const node = {
        name: key,
        path: newPath,
        type: item.type,
        level: level,
        description: item.description || null
      };

      if (item.type === 'folder') {
        if (item.children) {
          node.children = buildTree(item.children, newPath, level + 1);
        }
        if (item.files) {
          node.children = [
            ...(node.children || []),
            ...(Array.isArray(item.files) ? item.files.map(filename => ({
              name: filename,
              path: `${newPath}/${filename}`,
              type: 'file'
            })) : [])
          ];
        }
      }
      return node;
    });
  };

  return buildTree(FOLDER_STRUCTURE_DATA);
};


export const generateBreadcrumb = (folderPath) => {
  if (!folderPath) return [];

  const parts = folderPath.split('/').filter(part => part !== '');
  const breadcrumb = [];

  for (let i = 0; i < parts.length; i++) {
    breadcrumb.push({
      name: parts[i],
      path: parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1
    });
  }

  return breadcrumb;
};

export const searchFiles = (searchTerm) => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet. Call loadFolderStructure() first.");
    return [];
  }
  const results = [];
  const searchLower = searchTerm.toLowerCase();

  const searchInFolder = (obj, currentPath = '') => {
    if (!obj)
      return;
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      if (item.type === 'folder') {
        if (item.files && Array.isArray(item.files)) { item.files.forEach(filename => {
            const filenameLower = filename.toLowerCase();
            const sampleName = generateSampleName(filename).toLowerCase();
            const fileType = detectFileType(filename).toLowerCase();

            if (filenameLower.includes(searchLower) ||
              sampleName.includes(searchLower) ||
              fileType.includes(searchLower)) {
              results.push({
                filename,
                folderPath: newPath,
                sampleName: generateSampleName(filename),
                fileType: detectFileType(filename)
              });
            }
          });
        }

        if (item.children) {
          searchInFolder(item.children, newPath);
        }
      }
    });
  };

  searchInFolder(FOLDER_STRUCTURE_DATA);
  return results;
};

export const addFileToPath = (folderPath, filename) => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet.");
    return false;
  }
  const pathParts = folderPath.split('/').filter(part => part !== '');
  let current = FOLDER_STRUCTURE_DATA;

  for (const part of pathParts) {
    if (current && current[part]) { current = current[part];
      if (current.children) {
        current = current.children;
      }
    } else {
      console.error(`폴더 경로 "${folderPath}"를 찾을 수 없습니다.`);
      return false;
    }
  }

  if (!current.files) {
    current.files = [];
  }

  if (!current.files.includes(filename)) {
    current.files.push(filename);
    console.log(`파일 "${filename}"이 "${folderPath}"에 추가되었습니다.`);
    return true;
  } else {
    console.log(`파일 "${filename}"은 이미 "${folderPath}"에 존재합니다.`);
    return false;
  }
};

export const createFolder = (parentPath, folderName) => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet.");
    return false;
  }
  const pathParts = parentPath ? parentPath.split('/').filter(part => part !== '') : [];
  let current = FOLDER_STRUCTURE_DATA;

  for (const part of pathParts) {
    if (current && current[part]) { current = current[part];
      if (current.children) {
        current = current.children;
      }
    } else {
      console.error(`부모 폴더 경로 "${parentPath}"를 찾을 수 없습니다.`);
      return false;
    }
  }

  if (current && !current[folderName]) { current[folderName] = {
      type: 'folder',
      files: []
    };
    console.log(`폴더 "${folderName}"이 "${parentPath || 'root'}"에 생성되었습니다.`);
    return true;
  } else {
    console.log(`폴더 "${folderName}"은 이미 존재합니다.`);
    return false;
  }
};

export const detectFileType = (filename) => {
  const name = filename.toLowerCase();

  if (name.includes('idvd')) {
    return 'IDVD';
  }

  if (
  name.includes('idvg') &&
  (
    (name.includes('linear') || name.includes('lin')) &&
    (name.includes('hys') || name.includes('hysteresis'))
  ) || (
    name.includes('idvg') &&
    (name.includes('hys') || name.includes('hysteresis'))
  )
) {
  return 'IDVG-Hysteresis';
}

  if (name.includes('idvg') &&
    (name.includes('sat') || name.includes('saturation'))) {
    return 'IDVG-Saturation';
  }

  if (name.includes('idvg') &&
    (name.includes('linear') || name.includes('lin'))) {
    return 'IDVG-Linear';
  }

  return 'Unknown';
};

export const generateSampleName = (filename) => {
  let sampleName = filename.replace(/\.[^/.]+$/, "");

  const keywords = [
    'IDVG', 'Linear', 'Lin',
    'Saturation', 'Sat',
    'Hysteresis', 'Hys',
    'IDVD'
  ];

  keywords.forEach(keyword => {
    const regex = new RegExp(`_?${keyword}_?`, 'ig');
    sampleName = sampleName.replace(regex, '_');
  });

  sampleName = sampleName.replace(/__+/g, '_');
  sampleName = sampleName.replace(/^_|_$/g, '');

  return sampleName;
};

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

export const getFolderStats = () => {
  if (!FOLDER_STRUCTURE_DATA) {
    console.warn("FOLDER_STRUCTURE_DATA not loaded yet.");
    return {
      totalFolders: 0,
      totalFiles: 0,
      fileTypeDistribution: {},
      folderFileCount: {}
    };
  }
  const stats = {
    totalFolders: 0,
    totalFiles: 0,
    fileTypeDistribution: {},
    folderFileCount: {}
  };

  const countInFolder = (obj, currentPath = '') => {
    if (!obj)
      return;
    Object.keys(obj).forEach(key => {
      const item = obj[key];
      const newPath = currentPath ? `${currentPath}/${key}` : key;

      if (item.type === 'folder') {
        stats.totalFolders++;

        if (item.files && Array.isArray(item.files)) { const fileCount = item.files.length;
          stats.totalFiles += fileCount;
          stats.folderFileCount[newPath] = fileCount;

          item.files.forEach(filename => {
            const fileType = detectFileType(filename);
            stats.fileTypeDistribution[fileType] =
              (stats.fileTypeDistribution[fileType] || 0) + 1;
          });
        }

        if (item.children) {
          countInFolder(item.children, newPath);
        }
      }
    });
  };

  countInFolder(FOLDER_STRUCTURE_DATA);
  return stats;
};