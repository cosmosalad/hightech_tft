// TFTEducationPodcast.js
import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, RotateCcw, Headphones, Globe, Mic, MessageCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TFTEducationPodcast = ({ onClose }) => {
  const [currentLanguage, setCurrentLanguage] = useState('korean');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [audioError, setAudioError] = useState(null);
  
  const audioRef = useRef(null);

  // GitHub Raw 링크로 오디오 경로 설정
  const getAudioUrl = (filename) => {
    return `https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/data/audio/${filename}`;
  };

  const languages = {
    korean: {
      name: '한국어',
      flag: '🇰🇷',
      audioPath: getAudioUrl('TFT_kr.mp3'),
      description: 'TFT의 기본 원리부터 전기적 특성까지 상세하게 설명합니다',
      aiName: 'TFT 연구팀',
      color: 'from-blue-500 to-purple-600'
    },
    english: {
      name: 'English',
      flag: '🇺🇸',
      audioPath: getAudioUrl('TFT_en.mp3'),
      description: 'Comprehensive explanation of TFT principles and electrical characteristics',
      aiName: 'TFT Research Team',
      color: 'from-emerald-500 to-teal-600'
    },
    japanese: {
      name: '日本語',
      flag: '🇯🇵',
      audioPath: getAudioUrl('TFT_jp.mp3'),
      description: 'TFTの基本原理から電気的特性まで詳しく説明します',
      aiName: 'TFT 研究团队',
      color: 'from-purple-500 to-indigo-600'
    },
    chinese: {
      name: '中文',
      flag: '🇨🇳',
      audioPath: getAudioUrl('TFT_cn.mp3'),
      description: '从TFT基本原理到电学特性的详细说明',
      aiName: 'TFT研究チーム',
      color: 'from-red-500 to-pink-600'
    }
  };

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleLoadStart = () => {
      setIsLoading(true);
      setAudioError(null);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setAiSpeaking(false);
    };
    const handleError = (e) => {
      setIsLoading(false);
      setIsPlaying(false);
      setAiSpeaking(false);
      setAudioError('오디오 파일을 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
      console.error('Audio error:', e);
    };
    const handleLoadedData = () => {
      setAudioError(null);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [currentLanguage]);

  // 볼륨 조절
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // AI 말하는 애니메이션 효과
  useEffect(() => {
    if (isPlaying) {
      setAiSpeaking(true);
    } else {
      setAiSpeaking(false);
    }
  }, [isPlaying]);

  // 언어 변경 시 에러 상태 초기화
  useEffect(() => {
    setAudioError(null);
    setIsPlaying(false);
    setAiSpeaking(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentLanguage]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Play failed:', error);
            setAudioError('재생에 실패했습니다. 다시 시도해주세요.');
          });
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || audioError || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;

    audio.currentTime = 0;
    if (!isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('Restart play failed:', error);
            setAudioError('재생에 실패했습니다. 다시 시도해주세요.');
          });
      }
    }
  };

  const handleRetry = () => {
    setAudioError(null);
    setIsLoading(true);
    const audio = audioRef.current;
    if (audio) {
      audio.load(); // 오디오 파일 다시 로드
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentLang = languages[currentLanguage];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] max-h-[650px] overflow-hidden flex flex-col"
      >
        {/* 헤더 */}
        <div className={`bg-gradient-to-r ${currentLang.color} text-white p-4 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Headphones className="w-6 h-6 mr-2" />
              <div>
                <h2 className="text-xl font-bold">TFT 학습 팟캐스트</h2>
                <p className="text-white/90 text-xs">강의자와 함께하는 오디오 학습</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 언어 선택 */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              언어 선택
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(languages).map(([key, lang]) => (
                <button
                  key={key}
                  onClick={() => setCurrentLanguage(key)}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    currentLanguage === key
                      ? `border-blue-500 bg-gradient-to-r ${lang.color} text-white shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <span className="text-lg mr-2">{lang.flag}</span>
                    <span className="font-semibold text-sm">{lang.name}</span>
                  </div>
                  <p className={`text-xs ${currentLanguage === key ? 'text-white/90' : 'text-gray-600'}`}>
                    {lang.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* AI 캐릭터 섹션 */}
          <div className="text-center">
            <motion.div
              animate={{
                scale: aiSpeaking ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: aiSpeaking ? Infinity : 0,
                ease: "easeInOut"
              }}
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${currentLang.color} mb-3 shadow-xl`}
            >
              <div className="relative">
                <MessageCircle className="w-10 h-10 text-white" />
                {aiSpeaking && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Mic className="w-2 h-2 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.div>
            <h4 className="text-lg font-bold text-gray-800 mb-1">{currentLang.aiName}</h4>
            <p className="text-sm text-gray-600">
              {audioError ? '오디오 로드 실패' : 
               aiSpeaking ? '설명 중입니다...' : 
               'TFT 연구팀이 상세하게 설명해드립니다'}
            </p>
          </div>

          {/* 오디오 에러 표시 */}
          {audioError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{audioError}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="ml-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {/* 오디오 플레이어 */}
          <div className={`bg-gradient-to-r ${currentLang.color} rounded-xl p-4 text-white shadow-lg ${audioError ? 'opacity-50' : ''}`}>
            <audio
              ref={audioRef}
              src={currentLang.audioPath}
              preload="metadata"
              crossOrigin="anonymous"
            />
            
            {/* 진행 바 */}
            <div className="mb-4">
              <div
                className={`w-full h-2 bg-white/20 rounded-full overflow-hidden ${audioError ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-white/80">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleRestart}
                disabled={audioError}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="처음부터"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={isLoading || audioError}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  disabled={audioError}
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none slider disabled:opacity-50"
                />
              </div>
            </div>

            {/* 로딩/상태 표시 */}
            {isLoading && !audioError && (
              <div className="text-center mt-3">
                <p className="text-white/80 text-xs">GitHub에서 오디오를 로딩중...</p>
              </div>
            )}
          </div>

          {/* 학습 팁 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">💡 학습 팁</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 이어폰이나 헤드폰 사용을 권장합니다</li>
              <li>• 중요한 부분은 여러 번 반복해서 들어보세요</li>
              <li>• 처음 로딩 시 시간이 조금 걸릴 수 있습니다</li>
              <li>• 4개 언어로 다양한 학습 경험을 즐겨보세요</li>
            </ul>
          </div>

          {/* GitHub 정보 */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">🔗 오디오 소스:</span> GitHub Repository에서 직접 로드됩니다
            </p>
            <p className="text-xs text-blue-600 mt-1">
              현재 언어: {currentLang.name} ({currentLang.flag})
            </p>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .slider:disabled::-webkit-slider-thumb {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .slider:disabled::-moz-range-thumb {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TFTEducationPodcast;