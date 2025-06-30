// src/pages/utils/analysisExportImport.js

/**
 * 🎯 TFT Analyzer 분석기록 내보내기/불러오기 유틸리티 (간소화 버전)
 * 
 * 기능:
 * - 전체 세션 내보내기
 * - 분석기록 불러오기
 * - Analytics 추적
 */

import { trackFeatureUsage, trackError } from './analytics';

// ===== 내보내기 함수 =====

/**
 * 여러 세션 일괄 내보내기 (전체 세션 내보내기)
 * @param {Array} sessions - 내보낼 세션들
 * @param {boolean} includeRawData - 원본 데이터 포함 여부
 * @returns {Object} 성공/실패 결과
 */
export const exportMultipleSessions = (sessions, includeRawData = false) => {
  try {
    if (!sessions || sessions.length === 0) {
      return { success: false, message: '내보낼 세션이 없습니다.' };
    }

    const exportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      type: "multiple_sessions",
      sessionCount: sessions.length,
      sessions: sessions.map(session => ({
        id: session.id,
        name: session.name,
        createdAt: session.createdAt,
        deviceParams: session.deviceParams,
        parameterMode: session.parameterMode,
        analysisResults: session.analysisResults,
        completeAnalysisResults: session.completeAnalysisResults,
        uploadedFiles: session.uploadedFiles?.map(file => ({
          name: file.name,
          type: file.type,
          alias: file.alias,
          id: file.id,
          source: file.source || 'local',
          folder: file.folder,
          individualParams: file.individualParams,
          ...(includeRawData && file.rawData && { rawData: file.rawData })
        })) || []
      }))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `TFT_Analysis_전체세션_${sessions.length}개_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    trackFeatureUsage('export_all_sessions', {
      session_count: sessions.length,
      include_raw_data: includeRawData
    });

    return { 
      success: true, 
      message: `${sessions.length}개 세션이 성공적으로 내보내기되었습니다.` 
    };

  } catch (error) {
    console.error('Export all sessions failed:', error);
    trackError('export_all_sessions', error.message);
    return { 
      success: false, 
      message: `전체 세션 내보내기 중 오류가 발생했습니다: ${error.message}` 
    };
  }
};

// ===== 불러오기 함수 =====

/**
 * 분석 세션 불러오기
 * @param {File} file - 불러올 JSON 파일
 * @returns {Object} 성공/실패 결과와 세션 데이터
 */
export const importAnalysisSession = async (file) => {
  try {
    if (!file || file.type !== 'application/json') {
      return { success: false, message: 'JSON 파일을 선택해주세요.' };
    }

    const text = await file.text();
    const importData = JSON.parse(text);

    // 버전 호환성 검사
    if (!importData.version) {
      return { success: false, message: '지원하지 않는 파일 형식입니다.' };
    }

    let sessions = [];

    // 단일 세션 불러오기
    if (importData.type === "single_session" && importData.sessionData) {
      const session = {
        ...importData.sessionData,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${importData.sessionData.name} (불러옴)`,
        createdAt: new Date().toISOString(),
        isImported: true,
        originalExportDate: importData.exportDate
      };
      sessions = [session];
    }
    // 다중 세션 불러오기 (전체 세션)
    else if (importData.type === "multiple_sessions" && importData.sessions) {
      sessions = importData.sessions.map((sessionData, index) => ({
        ...sessionData,
        id: `imported_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${sessionData.name} (불러옴)`,
        createdAt: new Date().toISOString(),
        isImported: true,
        originalExportDate: importData.exportDate
      }));
    }
    else {
      return { success: false, message: '올바르지 않은 파일 구조입니다.' };
    }

    // Analytics 추적
    trackFeatureUsage('import_analysis_sessions', {
      session_count: sessions.length,
      original_export_date: importData.exportDate,
      file_size_kb: Math.round(file.size / 1024)
    });

    return { 
      success: true, 
      sessions, 
      message: sessions.length === 1 
        ? '분석기록이 성공적으로 불러와졌습니다.' 
        : `${sessions.length}개 세션이 성공적으로 불러와졌습니다.`
    };

  } catch (error) {
    console.error('Import failed:', error);
    trackError('import_sessions', error.message, file?.name);
    
    let errorMessage = '불러오기 중 오류가 발생했습니다.';
    
    if (error.message.includes('JSON')) {
      errorMessage = '파일 형식이 올바르지 않습니다. JSON 파일인지 확인해주세요.';
    } else if (error.message.includes('지원하지 않는')) {
      errorMessage = '지원하지 않는 파일 버전입니다.';
    }

    return { success: false, message: errorMessage };
  }
};