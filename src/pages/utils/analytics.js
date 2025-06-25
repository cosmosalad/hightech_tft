// src/utils/analytics.js - TFT Analyzer Google Analytics 추적 시스템

export const GA_TRACKING_ID = 'G-CQHN7V0XZT';

// 기본 이벤트 추적 함수 (안전한 실행)
const trackEvent = (eventName, parameters = {}) => {
  try {
    if (typeof window !== 'undefined' && 
        window.gtag && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      window.gtag('event', eventName, parameters);
    }
  } catch (error) {
    console.warn('Analytics tracking error:', error);
  }
};

// 페이지뷰 추적
export const trackPageView = (pageName, pageTitle) => {
  try {
    if (typeof window !== 'undefined' && 
        window.gtag && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      window.gtag('config', GA_TRACKING_ID, {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pageName
      });
    }
  } catch (error) {
    console.warn('Page view tracking error:', error);
  }
};

// 1. 파일 업로드 추적
export const trackFileUpload = (fileTypes, fileCount, source = 'local') => {
  trackEvent('file_upload', {
    event_category: 'file_management',
    file_types: Array.isArray(fileTypes) ? fileTypes.join(',') : fileTypes,
    file_count: fileCount,
    upload_source: source, // 'local' or 'github'
    value: fileCount
  });
};

// 2. 분석 시작 추적
export const trackAnalysisStart = (fileCount, sampleCount, hasIndividualParams = false) => {
  trackEvent('analysis_start', {
    event_category: 'analysis',
    file_count: fileCount,
    sample_count: sampleCount,
    parameter_mode: hasIndividualParams ? 'individual' : 'single',
    value: fileCount
  });
};

// 3. 분석 완료 추적
export const trackAnalysisComplete = (duration, fileCount, successCount, errorCount = 0) => {
  trackEvent('analysis_complete', {
    event_category: 'analysis',
    analysis_duration_seconds: Math.round(duration / 1000),
    file_count: fileCount,
    success_count: successCount,
    error_count: errorCount,
    success_rate: Math.round((successCount / fileCount) * 100),
    value: successCount
  });
};

// 4. GitHub 파일 로드 추적
export const trackGitHubLoad = (folderName, fileCount, loadTime = null) => {
  trackEvent('github_file_load', {
    event_category: 'data_source',
    folder_name: folderName,
    file_count: fileCount,
    load_time_ms: loadTime ? Math.round(loadTime) : null,
    value: fileCount
  });
};

// 5. 파라미터 설정 추적
export const trackParameterMode = (mode, deviceParams) => {
  trackEvent('parameter_mode_change', {
    event_category: 'configuration',
    parameter_mode: mode, // 'single' or 'individual'
    w_um: Math.round(deviceParams.W * 1e6), // μm 단위로 변환
    l_um: Math.round(deviceParams.L * 1e6), // μm 단위로 변환
    tox_nm: Math.round(deviceParams.tox * 1e9) // nm 단위로 변환
  });
};

// 6. 차트 상호작용 추적
export const trackChartInteraction = (chartType, action, additionalInfo = {}) => {
  trackEvent('chart_interaction', {
    event_category: 'visualization',
    chart_type: chartType, // 'IDVG-Linear', 'IDVD', 'Hysteresis', etc.
    interaction_type: action, // 'toggle_log', 'zoom', 'download', 'hover', etc.
    ...additionalInfo
  });
};

// 7. 데이터 테이블 조회 추적
export const trackDataTableView = (measurementTypes, sampleCount) => {
  trackEvent('data_table_view', {
    event_category: 'data_exploration',
    measurement_types: Array.isArray(measurementTypes) ? measurementTypes.join(',') : measurementTypes,
    sample_count: sampleCount,
    value: sampleCount
  });
};

// 8. 수식 코드 검사 추적
export const trackFormulaInspection = (parameterName, codeLanguage = 'javascript') => {
  trackEvent('formula_code_view', {
    event_category: 'educational',
    parameter_name: parameterName,
    code_language: codeLanguage
  });
};

// 9. 검색 추적
export const trackSearch = (searchTerm, resultCount, searchContext = 'github_files') => {
  trackEvent('search', {
    event_category: 'search',
    search_term: searchTerm.toLowerCase().substring(0, 50), // 개인정보 보호를 위해 50자 제한
    result_count: resultCount,
    search_context: searchContext,
    value: resultCount
  });
};

// 10. 오류 추적
export const trackError = (errorType, errorMessage, context = null) => {
  trackEvent('error_occurred', {
    event_category: 'error',
    error_type: errorType, // 'file_parse', 'analysis', 'upload', 'github_load' etc.
    error_message: errorMessage.substring(0, 100), // 첫 100자만
    error_context: context,
    fatal: false
  });
};

// 11. 성능 추적
export const trackPerformance = (action, duration, additionalMetrics = {}) => {
  trackEvent('performance_metric', {
    event_category: 'performance',
    action: action, // 'file_parse', 'chart_render', 'analysis_compute'
    duration_ms: Math.round(duration),
    ...additionalMetrics
  });
};

// 12. 사용자 참여도 추적
export const trackEngagement = (action, value = 1, context = null) => {
  trackEvent('user_engagement', {
    event_category: 'engagement',
    engagement_type: action, // 'feature_usage', 'time_spent', 'interaction_depth'
    engagement_context: context,
    value: value
  });
};

// 13. 파일 제거 추적
export const trackFileRemove = (fileType, totalFilesRemaining) => {
  trackEvent('file_remove', {
    event_category: 'file_management',
    file_type: fileType,
    files_remaining: totalFilesRemaining
  });
};

// 14. 샘플명 변경 추적
export const trackSampleRename = (fileType, hasCustomName) => {
  trackEvent('sample_rename', {
    event_category: 'customization',
    file_type: fileType,
    has_custom_name: hasCustomName
  });
};

// 15. 세션 시작/종료 추적
export const trackSessionStart = () => {
  trackEvent('session_start', {
    event_category: 'session',
    timestamp: new Date().toISOString()
  });
};

export const trackSessionEnd = (sessionDuration) => {
  trackEvent('session_end', {
    event_category: 'session',
    session_duration_minutes: Math.round(sessionDuration / 60000),
    value: Math.round(sessionDuration / 60000)
  });
};

// 16. 기능 사용 빈도 추적
export const trackFeatureUsage = (featureName, usageCount = 1) => {
  trackEvent('feature_usage', {
    event_category: 'features',
    feature_name: featureName,
    usage_count: usageCount,
    value: usageCount
  });
};

// 사용자 속성 설정 (선택적)
export const setUserProperties = (properties) => {
  try {
    if (typeof window !== 'undefined' && 
        window.gtag && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      window.gtag('config', GA_TRACKING_ID, {
        user_properties: properties
      });
    }
  } catch (error) {
    console.warn('User properties setting error:', error);
  }
};

// 세션 타이머 (자동 세션 추적용)
let sessionStartTime = null;

export const initializeSession = () => {
  sessionStartTime = Date.now();
  trackSessionStart();
  
  // 페이지 언로드 시 세션 종료 추적
  window.addEventListener('beforeunload', () => {
    if (sessionStartTime) {
      const sessionDuration = Date.now() - sessionStartTime;
      trackSessionEnd(sessionDuration);
    }
  });
};