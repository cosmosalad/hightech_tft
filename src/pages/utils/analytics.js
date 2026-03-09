class GoogleSheetsTracker {
  constructor() {
    this.SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxda0mXlDsHmpn3xTIY7peVc0OKuIH67H66785qdRrvJ-M3N5sftVmiyd_rWm3-pM6xvg/exec';
    this.userId = this.getUserId();
    this.sessionId = this.generateSessionId();
    this.startTracking();
  }

  getUserId() {
    let userId = localStorage.getItem('sheetsUserId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem('sheetsUserId', userId);
    }
    return userId;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  async sendToSheet(action, details = '') {
    try {
      const data = {
        userId: this.userId,
        sessionId: this.sessionId,
        action: action,
        details: details,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: 'no-cors'
      });

      console.log('📊 Google Sheets 전송:', action);
    } catch (error) {
      console.warn('📡 Sheets 전송 실패:', error);
    }
  }

  startTracking() {
    this.sendToSheet('page_visit', document.referrer || '직접 접속');

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.closest('button') || target;
        const buttonText = button.textContent.trim().substring(0, 20);
        this.sendToSheet('button_click', buttonText);
      }
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') || target;
        const linkText = link.textContent.trim().substring(0, 20);
        this.sendToSheet('link_click', linkText);
      }
    });

    document.addEventListener('change', (event) => {
      if (event.target.type === 'file') {
        const fileCount = event.target.files.length;
        const fileNames = Array.from(event.target.files).map(f => f.name).join(', ').substring(0, 50);
        this.sendToSheet('file_upload', `${fileCount}개 파일: ${fileNames}`);
      }
    });

    setInterval(() => {
      this.sendToSheet('heartbeat', '활성 상태');
    }, 5 * 60 * 1000);

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - parseInt(this.sessionId.split('_')[1], 10);
      this.sendToSheet('session_end', `${Math.round(sessionDuration / 60000)}분`);
    });

    console.log('🎯 Google Sheets 실시간 추적 시작!');
    console.log('📊 데이터는 Google Sheets에 자동 저장됩니다.');
  }
}

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
    console.log(`🔍 [${logEntry.koreanTime}] ${logEntry.action}:`, logEntry.details);

    try {
      const existingLogs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
      existingLogs.push(logEntry);

      if (existingLogs.length > 500) {
        existingLogs.splice(0, existingLogs.length - 500);
      }

      localStorage.setItem('userActivityLogs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('로컬스토리지 저장 실패:', error);
    }
  }

  startLogging() {
    this.createLog('page_visit', {
      이전페이지: document.referrer || '직접 접속'
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const buttonText = target.textContent || target.closest('button').textContent;
        this.createLog('button_click', {
          버튼텍스트: buttonText.substring(0, 30),
          버튼ID: target.id || target.closest('button').id || '없음'
        });
      }

      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') || target;
        this.createLog('link_click', {
          링크텍스트: link.textContent.substring(0, 30),
          링크주소: link.href
        });
      }
    });

    document.addEventListener('change', (event) => {
      if (event.target.type === 'file') {
        this.createLog('file_input_change', {
          파일수: event.target.files.length,
          파일이름들: Array.from(event.target.files).map(f => f.name).join(', ')
        });
      }
    });

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - parseInt(this.sessionId.split('_')[1], 10);
      this.createLog('session_end', {
        세션시간_분: Math.round(sessionDuration / 60000)
      });
    });

    console.log('✅ 사용자 활동 추적이 시작되었습니다!');
  }

  getCurrentActiveUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentLogs = this.logs.filter(log =>
      new Date(log.timestamp) >= fiveMinutesAgo
    );
    return new Set(recentLogs.map(log => log.userId)).size;
  }

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
      default:
        startTime.setDate(now.getDate() - 1);
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

  getRealTimeDashboard() {
    const currentUsers = this.getCurrentActiveUsers();
    const todayStats = this.generateActivityStats('1day');
    const recentActivity = this.logs.slice(-10).reverse().map(log => ({
      시간: log.koreanTime,
      활동: log.action,
      상세: log.details,
      사용자: log.userId.split('_')[1]
    }));

    return {
      현재활성사용자: currentUsers,
      오늘통계: todayStats,
      최근활동: recentActivity,
      마지막업데이트: new Date().toLocaleString('ko-KR')
    };
  }

  exportLogs(format = 'json') {
    const logs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
    return JSON.stringify(logs, null, 2);
  }
}

const googleSheetsTracker = new GoogleSheetsTracker();
const globalUserLogger = new UserActivityLogger();

export const trackPageView = () => {};
export const trackFileUpload = (fileTypes, fileCount, source = 'local') => {
  googleSheetsTracker.sendToSheet('file_upload', `${fileCount}개 파일 (${source})`);
};
export const trackAnalysisStart = (fileCount, sampleCount) => {
  googleSheetsTracker.sendToSheet('analysis_start', `${fileCount}개 파일, ${sampleCount}개 샘플`);
};
export const trackAnalysisComplete = (duration, fileCount, successCount, errorCount = 0) => {
  googleSheetsTracker.sendToSheet('analysis_complete', `${successCount}/${fileCount} 성공, ${Math.round(duration/1000)}초`);
};
export const trackGitHubLoad = (folderName, fileCount) => {
  googleSheetsTracker.sendToSheet('github_file_load', `${folderName}: ${fileCount}개 파일`);
};
export const trackParameterMode = (mode, deviceParams) => {
  googleSheetsTracker.sendToSheet('parameter_mode', mode);
};
export const trackChartInteraction = (chartType, action) => {
  googleSheetsTracker.sendToSheet('chart_interaction', `${chartType}: ${action}`);
};
export const trackDataTableView = (measurementTypes, sampleCount) => {
  googleSheetsTracker.sendToSheet('data_table_view', `${measurementTypes}: ${sampleCount}개`);
};
export const trackFormulaInspection = (parameterName) => {
  googleSheetsTracker.sendToSheet('formula_inspection', parameterName);
};
export const trackSearch = (searchTerm, resultCount) => {
  googleSheetsTracker.sendToSheet('search', `"${searchTerm}": ${resultCount}개 결과`);
};
export const trackError = (errorType, errorMessage) => {
  googleSheetsTracker.sendToSheet('error', `${errorType}: ${errorMessage.substring(0, 50)}`);
};
export const trackPerformance = (action, duration) => {
  googleSheetsTracker.sendToSheet('performance', `${action}: ${Math.round(duration)}ms`);
};
export const trackEngagement = (action, value = 1, context = null) => {
  googleSheetsTracker.sendToSheet('engagement', `${action}: ${context || ''}`);
};
export const trackFileRemove = (fileType, totalFilesRemaining) => {
  googleSheetsTracker.sendToSheet('file_remove', `${fileType}, ${totalFilesRemaining}개 남음`);
};
export const trackSampleRename = (fileType, hasCustomName) => {
  googleSheetsTracker.sendToSheet('sample_rename', `${fileType}: ${hasCustomName ? '사용자정의' : '기본'}`);
};
export const trackSessionStart = () => {
  googleSheetsTracker.sendToSheet('session_start', '세션 시작');
};
export const trackSessionEnd = (sessionDuration) => {
  googleSheetsTracker.sendToSheet('session_end', `${Math.round(sessionDuration / 60000)}분`);
};
export const trackFeatureUsage = (featureName, usageCount = 1) => {
  googleSheetsTracker.sendToSheet('feature_usage', `${featureName}: ${usageCount}회`);
};
export const setUserProperties = () => {};
export const initializeSession = () => {};

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

if (typeof window !== 'undefined') {
  window.userLogger = globalUserLogger;
  window.getUserStats = getUserStats;
  window.getRealTimeDashboard = getRealTimeDashboard;
  window.exportUserLogs = exportUserLogs;

  setInterval(() => {
    const dashboard = getRealTimeDashboard();
    if (dashboard.현재활성사용자 > 0) {
      console.log(`🟢 활성 사용자: ${dashboard.현재활성사용자}명, 오늘 활동: ${dashboard.오늘통계.총활동수}회`);
    }
  }, 10000);
}

console.log('🎉 간소화된 추적 시스템 활성화 완료! (Google Sheets만)');
console.log('📊 Google Sheets에서 실시간 확인 가능');
console.log('🔍 로컬 확인: getRealTimeDashboard()');