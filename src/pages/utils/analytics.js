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

// ===== 🔍 Enhanced User Activity Logger (새로 추가된 부분) =====

class UserActivityLogger {
  constructor() {
    this.logs = [];
    this.sessionId = this.generateSessionId();
    this.startLogging();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createLog(action, details = {}) {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      koreanTime: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      userAgent: navigator.userAgent,
      url: window.location.href,
      action: action,
      details: details,
      userId: this.getUserId()
    };
    
    this.logs.push(logEntry);
    this.saveLog(logEntry);
    return logEntry;
  }

  getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  saveLog(logEntry) {
    // 브라우저 콘솔에 한국어로 깔끔하게 출력
    console.log(`🔍 [${logEntry.koreanTime}] ${logEntry.action}:`, logEntry.details);

    // 로컬스토리지에 저장
    try {
      const existingLogs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
      existingLogs.push(logEntry);
      
      // 최대 1000개까지만 저장
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('userActivityLogs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('로컬스토리지 저장 실패:', error);
    }

    // Google Analytics에도 전송
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', logEntry.action, {
        event_category: 'user_activity_detailed',
        custom_parameter_1: JSON.stringify(logEntry.details),
        session_id: logEntry.sessionId
      });
    }
  }

  // 📊 현재 활성 사용자 수
  getCurrentActiveUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) >= fiveMinutesAgo
    );
    return new Set(recentLogs.map(log => log.userId)).size;
  }

  // 📈 활동 통계 (한국어 포함)
  generateActivityStats(timeRange = '1day') {
    const now = new Date();
    const startTime = new Date();
    
    switch(timeRange) {
      case '1hour':
        startTime.setHours(now.getHours() - 1);
        break;
      case '1day':
        startTime.setDate(now.getDate() - 1);
        break;
      case '1week':
        startTime.setDate(now.getDate() - 7);
        break;
    }

    const filteredLogs = this.logs.filter(log => 
      new Date(log.timestamp) >= startTime
    );

    const actionBreakdown = {};
    const actionNames = {
      'page_visit': '페이지 방문',
      'button_click': '버튼 클릭',
      'file_upload': '파일 업로드',
      'session_end': '세션 종료',
      'github_file_load': 'GitHub 파일 로드',
      'analysis_start': '분석 시작'
    };

    filteredLogs.forEach(log => {
      const koreanName = actionNames[log.action] || log.action;
      actionBreakdown[koreanName] = (actionBreakdown[koreanName] || 0) + 1;
    });

    return {
      총활동수: filteredLogs.length,
      순사용자수: new Set(filteredLogs.map(log => log.userId)).size,
      활동분석: actionBreakdown,
      기간: timeRange,
      시작시간: startTime.toLocaleString('ko-KR'),
      종료시간: now.toLocaleString('ko-KR')
    };
  }

  // 📊 실시간 대시보드 (한국어)
  getRealTimeDashboard() {
    const currentUsers = this.getCurrentActiveUsers();
    const todayStats = this.generateActivityStats('1day');
    const recentActivity = this.logs.slice(-10).reverse().map(log => ({
      시간: log.koreanTime,
      활동: log.action,
      상세: log.details,
      사용자: log.userId.split('_')[1] // 사용자 ID 일부만 표시
    }));

    return {
      현재활성사용자: currentUsers,
      오늘통계: todayStats,
      최근활동: recentActivity,
      마지막업데이트: new Date().toLocaleString('ko-KR')
    };
  }

  // 📤 로그 내보내기
  exportLogs(format = 'json') {
    const logs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
    
    if (format === 'csv') {
      if (logs.length === 0) return '';
      
      const headers = ['한국시간', '세션ID', '사용자ID', '활동', 'URL', '상세정보'];
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          log.koreanTime,
          log.sessionId,
          log.userId,
          log.action,
          log.url,
          JSON.stringify(log.details).replace(/,/g, ';')
        ].join(','))
      ].join('\n');
      
      return csvContent;
    }
    return JSON.stringify(logs, null, 2);
  }

  // 🔧 자동 로깅 시작
  startLogging() {
    // 페이지 로드 시 자동 로그
    this.createLog('page_visit', {
      페이지: window.location.pathname,
      이전페이지: document.referrer || '직접 접속'
    });

    // 클릭 이벤트 자동 추적
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const buttonText = target.textContent || target.closest('button').textContent;
        this.createLog('button_click', {
          버튼텍스트: buttonText.substring(0, 30),
          버튼ID: target.id || target.closest('button').id || '없음',
          페이지: window.location.pathname
        });
      }
      
      // 링크 클릭도 추적
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') || target;
        this.createLog('link_click', {
          링크텍스트: link.textContent.substring(0, 30),
          링크주소: link.href,
          페이지: window.location.pathname
        });
      }
    });

    // 파일 입력 추적
    document.addEventListener('change', (event) => {
      if (event.target.type === 'file') {
        this.createLog('file_input_change', {
          파일수: event.target.files.length,
          파일이름들: Array.from(event.target.files).map(f => f.name).join(', '),
          페이지: window.location.pathname
        });
      }
    });

    // 페이지 떠날 때 세션 종료 로그
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - parseInt(this.sessionId.split('_')[1]);
      this.createLog('session_end', {
        세션시간_분: Math.round(sessionDuration / 60000),
        마지막페이지: window.location.pathname
      });
    });

    console.log('✅ 사용자 활동 추적이 시작되었습니다!');
    console.log('📊 실시간 현황 보기: getRealTimeDashboard()');
  }
}

// 🚀 전역 로거 인스턴스 생성
const globalUserLogger = new UserActivityLogger();

// 🎯 편리한 사용을 위한 헬퍼 함수들
export const logUserActivity = (action, details = {}) => {
  return globalUserLogger.createLog(action, details);
};

export const getUserStats = (timeRange = '1day') => {
  return globalUserLogger.generateActivityStats(timeRange);
};

export const getRealTimeDashboard = () => {
  return globalUserLogger.getRealTimeDashboard();
};

export const exportUserLogs = (format = 'json') => {
  return globalUserLogger.exportLogs(format);
};

// 콘솔에서 쉽게 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  window.userLogger = globalUserLogger;
  window.getUserStats = getUserStats;
  window.getRealTimeDashboard = getRealTimeDashboard;
  window.exportUserLogs = exportUserLogs;
  
  // 5초마다 현재 상황 요약 출력
  setInterval(() => {
    const dashboard = getRealTimeDashboard();
    if (dashboard.현재활성사용자 > 0) {
      console.log(`🟢 현재 활성 사용자: ${dashboard.현재활성사용자}명, 오늘 총 활동: ${dashboard.오늘통계.총활동수}회`);
    }
  }, 5000);
}

console.log('🎉 Enhanced User Activity Logger 활성화 완료!');
console.log('🔍 사용법:');
console.log('  - getRealTimeDashboard() : 실시간 대시보드');
console.log('  - getUserStats("1day") : 오늘 통계');
console.log('  - exportUserLogs("csv") : CSV로 내보내기');
console.log('  - 모든 활동이 콘솔에 실시간으로 표시됩니다!');