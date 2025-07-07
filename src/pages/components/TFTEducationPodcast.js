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
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const [visibleWords, setVisibleWords] = useState([]);
  const [subtitleError, setSubtitleError] = useState(null);
  
  const audioRef = useRef(null);
  const wordTimersRef = useRef([]);
  const lastSubtitleRef = useRef(null);

  // GitHub Raw 링크로 오디오 경로 설정
  const getAudioUrl = (filename) => {
    return `https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/data/audio/${filename}`;
  };

  // GitHub Raw 링크로 자막 경로 설정
  const getSubtitleUrl = (filename) => {
    return `https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/data/audio/${filename}`;
  };

  const languages = {
    korean: {
      name: '한국어',
      flag: '🇰🇷',
      audioPath: getAudioUrl('TFT_kr.mp3'),
      subtitlePath: getSubtitleUrl('TFT_kr.srt'),
      description: 'TFT의 기본 원리부터 전기적 특성까지 상세하게 설명합니다',
      aiName: 'TFT 연구팀',
      color: 'from-blue-500 to-purple-600'
    },
    english: {
      name: 'English',
      flag: '🇺🇸',
      audioPath: getAudioUrl('TFT_en.mp3'),
      subtitlePath: getSubtitleUrl('TFT_en.srt'),
      description: 'Comprehensive explanation of TFT principles and electrical characteristics',
      aiName: 'TFT Research Team',
      color: 'from-emerald-500 to-teal-600'
    },
    japanese: {
      name: '日本語',
      flag: '🇯🇵',
      audioPath: getAudioUrl('TFT_jp.mp3'),
      subtitlePath: getSubtitleUrl('TFT_jp.srt'),
      description: 'TFTの基本原理から電気的特性まで詳しく説明します',
      aiName: 'TFT 研究团队',
      color: 'from-purple-500 to-indigo-600'
    },
    chinese: {
      name: '中文',
      flag: '🇨🇳',
      audioPath: getAudioUrl('TFT_cn.mp3'),
      subtitlePath: getSubtitleUrl('TFT_cn.srt'),
      description: '从TFT基本原理到电学特性的详细说明',
      aiName: 'TFT研究チーム',
      color: 'from-red-500 to-pink-600'
    }
  };

  // SRT 자막 파일 파싱 함수
  const parseSRT = (srtText) => {
    const blocks = srtText.trim().split('\n\n');
    return blocks.map(block => {
      const lines = block.trim().split('\n');
      if (lines.length < 3) return null;
      
      const timeString = lines[1];
      const text = lines.slice(2).join('\n');
      
      // 시간 파싱 (00:00:10,500 --> 00:00:13,400)
      const timeMatch = timeString.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeMatch) return null;
      
      const startTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
      const endTime = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
      
      return {
        startTime,
        endTime,
        text: text.replace(/<[^>]+>/g, '') // HTML 태그 제거
      };
    }).filter(Boolean);
  };

  // 자막 로드 함수
  const loadSubtitles = async (subtitleUrl) => {
    try {
      setSubtitleError(null);
      console.log(`Loading subtitles from: ${subtitleUrl}`);
      
      const response = await fetch(subtitleUrl);
      if (!response.ok) {
        throw new Error(`자막 파일을 불러올 수 없습니다: ${response.status}`);
      }
      const srtText = await response.text();
      const parsedSubtitles = parseSRT(srtText);
      setSubtitles(parsedSubtitles);
      console.log(`Loaded ${parsedSubtitles.length} subtitle entries for ${subtitleUrl}`);
    } catch (error) {
      console.error('Subtitle loading error:', error);
      setSubtitleError('자막을 불러오는데 실패했습니다.');
      setSubtitles([]);
    }
  };

  // 모든 타이머와 상태 초기화 함수
  const clearAllTimersAndStates = () => {
    // 모든 단어 타이머 정리
    wordTimersRef.current.forEach(timer => clearTimeout(timer));
    wordTimersRef.current = [];
    
    // 자막 관련 상태 초기화
    setCurrentSubtitle('');
    setCurrentSubtitleIndex(-1);
    setVisibleWords([]);
    lastSubtitleRef.current = null;
  };

  // 언어별 단어 분할 함수
  const splitTextByLanguage = (text, language) => {
    if (!text) return [];
    
    switch (language) {
      case 'korean':
      case 'english':
        // 한국어와 영어는 공백 기준으로 분할
        return text.split(' ').filter(word => word.trim() !== '');
      
      case 'japanese':
        // 일본어는 공백이 있으면 공백 기준, 없으면 문자 기준으로 분할
        if (text.includes(' ')) {
          return text.split(' ').filter(word => word.trim() !== '');
        } else {
          // 히라가나, 카타카나, 한자 등을 고려한 분할
          return text.match(/[\u3040-\u309F]+|[\u30A0-\u30FF]+|[\u4E00-\u9FAF]+|[A-Za-z0-9]+|[^\s]/g) || [text];
        }
      
      case 'chinese':
        // 중국어는 문자 단위로 분할하여 한 글자씩 표시
        return text.split('');
      
      default:
        return text.split(' ').filter(word => word.trim() !== '');
    }
  };

  // 시간 기반 단어별 순차 표시 함수 (수정됨)
  const showWordsSequentially = (text, startTime, endTime, currentTime) => {
    clearAllTimersAndStates();
  
    if (!text || !isPlaying) { // isPlaying 조건 추가
      return;
    }
  
    const words = splitTextByLanguage(text, currentLanguage);
    const duration = endTime - startTime;
    const timePerWord = duration / words.length;
    const elapsedTime = currentTime - startTime;
  
    const minInterval = 0.15;
    const maxInterval = 0.6;
    const adjustedTimePerWord = Math.max(minInterval, Math.min(timePerWord, maxInterval));
  
    const wordsToShowImmediately = Math.floor(elapsedTime / adjustedTimePerWord);
    const initialWords = words.slice(0, Math.min(wordsToShowImmediately + 1, words.length)).map((word, index) => ({ word, index }));
    setVisibleWords(initialWords);
  
    words.slice(wordsToShowImmediately + 1).forEach((word, index) => {
      const actualIndex = wordsToShowImmediately + 1 + index;
      let showTime = (adjustedTimePerWord * actualIndex - elapsedTime) * 1000;
  
      const smoothDelay = 120 + (index * 80);
      showTime = Math.max(showTime, smoothDelay);
  
      if (showTime > 0 && actualIndex < words.length) {
        const timer = setTimeout(() => {
          // 타이머 실행 시점에도 재생 중인지 확인
          if (isPlaying) {
            setVisibleWords(prev => {
              const exists = prev.some(w => w.index === actualIndex);
              if (!exists) {
                return [...prev, { word, index: actualIndex }];
              }
              return prev;
            });
          }
        }, showTime);
  
        wordTimersRef.current.push(timer);
      }
    });
  };

  // 현재 시간에 맞는 자막 찾기 (수정됨)
  const updateCurrentSubtitle = (currentTime) => {
    if (subtitles.length === 0 || !isPlaying) { // isPlaying 조건 추가
      return;
    }
  
    const currentSubIndex = subtitles.findIndex(sub =>
      currentTime >= sub.startTime && currentTime <= sub.endTime
    );
  
    if (currentSubIndex !== currentSubtitleIndex) {
      setCurrentSubtitleIndex(currentSubIndex);
  
      if (currentSubIndex >= 0) {
        const currentSub = subtitles[currentSubIndex];
        setCurrentSubtitle(currentSub.text);
        showWordsSequentially(currentSub.text, currentSub.startTime, currentSub.endTime, currentTime);
        lastSubtitleRef.current = currentSub;
      } else {
        clearAllTimersAndStates();
      }
    }
  };

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      updateCurrentSubtitle(audio.currentTime); // 자막 업데이트
    };
    const updateDuration = () => setDuration(audio.duration);
    const handleLoadStart = () => {
      setIsLoading(true);
      setAudioError(null);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setAiSpeaking(false);
      clearAllTimersAndStates();
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
      
      // 컴포넌트 언마운트 시 정리
      clearAllTimersAndStates();
    };
  }, [currentLanguage, subtitles, isPlaying]); // isPlaying 의존성 추가

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

  // 언어 변경 시 완전 초기화 및 자막 로드
  useEffect(() => {
    console.log(`Language changed to: ${currentLanguage}`);
    
    // 완전한 상태 초기화
    setAudioError(null);
    setSubtitleError(null);
    clearAllTimersAndStates();
    
    // 재생 중이었다면 일시정지
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAiSpeaking(false);
    }
    
    setCurrentTime(0);
    setDuration(0);
    setSubtitles([]); // 자막 배열 완전 초기화
    
    // 새 언어의 자막 로드
    const currentLang = languages[currentLanguage];
    if (currentLang && currentLang.subtitlePath) {
      console.log(`Loading subtitles for language: ${currentLanguage}`);
      loadSubtitles(currentLang.subtitlePath);
    }
  }, [currentLanguage]);

  // 재생/일시정지 함수 (수정됨)
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
  
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      // 추가: 일시정지 시 단어 타이머들 정리
      wordTimersRef.current.forEach(timer => clearTimeout(timer));
      wordTimersRef.current = [];
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // 재생 재개 시 현재 시간에 맞는 자막으로 다시 시작
            updateCurrentSubtitle(audio.currentTime);
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
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    // 탐색 후 즉시 자막 업데이트
    if (isPlaying) {
        updateCurrentSubtitle(newTime);
    } else {
        // 일시정지 상태에서 탐색한 경우, 단어 표시를 위해 상태를 강제로 업데이트
        const currentSubIndex = subtitles.findIndex(sub => newTime >= sub.startTime && newTime <= sub.endTime);
        if (currentSubIndex !== -1) {
            const currentSub = subtitles[currentSubIndex];
            clearAllTimersAndStates(); // 기존 타이머 정리
            setCurrentSubtitle(currentSub.text);
            const words = splitTextByLanguage(currentSub.text, currentLanguage);
            setVisibleWords(words.map((word, index) => ({word, index}))); // 전체 문장 즉시 표시
        } else {
            clearAllTimersAndStates();
        }
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            updateCurrentSubtitle(0);
          })
          .catch((error) => {
            console.error('Restart play failed:', error);
            setAudioError('재생에 실패했습니다. 다시 시도해주세요.');
          });
      }
    } else {
        updateCurrentSubtitle(0);
    }
  };

  const handleRetry = () => {
    setAudioError(null);
    setSubtitleError(null);
    setIsLoading(true);
    clearAllTimersAndStates();
    
    const audio = audioRef.current;
    if (audio) {
      audio.load(); // 오디오 파일 다시 로드
    }
    // 자막도 다시 로드
    const currentLang = languages[currentLanguage];
    if (currentLang && currentLang.subtitlePath) {
      loadSubtitles(currentLang.subtitlePath);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] max-h-[700px] overflow-hidden flex flex-col"
      >
        {/* 헤더 */}
        <div className={`bg-gradient-to-r ${currentLang.color} text-white p-4 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Headphones className="w-6 h-6 mr-2" />
              <div>
                <h2 className="text-xl font-bold">TFT 학습 팟캐스트</h2>
                <p className="text-white/90 text-xs">오디오 & 자막 학습</p>
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

          {/* 자막 표시 영역 */}
          <div className="bg-gray-900 rounded-xl p-4 min-h-[120px] flex items-center justify-center">
            <div className="w-full max-w-3xl">
              {subtitleError ? (
                <p className="text-red-400 text-sm text-center">{subtitleError}</p>
              ) : visibleWords.length > 0 ? (
                <div className="text-white text-lg leading-relaxed text-left px-4">
                  {visibleWords.map((wordObj, index) => (
                    <motion.span
                      key={`${currentLanguage}-${currentSubtitleIndex}-${wordObj.index}`}
                      initial={{ 
                        opacity: 0
                      }}
                      animate={{ 
                        opacity: 1
                      }}
                      transition={{ 
                        duration: 1.2,
                        ease: [0.25, 0.1, 0.25, 1] // 매우 부드러운 베지어 곡선
                      }}
                      className="inline-block mb-1"
                      style={{
                        // 언어별 다른 간격 설정
                        marginRight: currentLanguage === 'korean' || currentLanguage === 'english' ? '0.4rem' : '0.1rem'
                      }}
                    >
                      {wordObj.word}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center">
                  {isPlaying ? '자막을 로딩중입니다...' : '재생을 시작하면 자막이 표시됩니다'}
                </p>
              )}
            </div>
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
                <p className="text-white/80 text-xs">GitHub에서 콘텐츠를 로딩중...</p>
              </div>
            )}
          </div>

          {/* 학습 팁 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">💡 학습 팁</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 이어폰이나 헤드폰 사용을 권장합니다</li>
              <li>• 자막과 함께 들으면 이해도가 높아집니다</li>
              <li>• 중요한 부분은 여러 번 반복해서 들어보세요</li>
              <li>• 처음 로딩 시 시간이 조금 걸릴 수 있습니다</li>
              <li>• 4개 언어로 다양한 학습 경험을 즐겨보세요</li>
            </ul>
          </div>

          {/* GitHub 정보 */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">🔗 소스:</span> GitHub Repository에서 오디오와 자막을 실시간 로드합니다
            </p>
            <p className="text-xs text-blue-600 mt-1">
              현재 언어: {currentLang.name} ({currentLang.flag}) | 자막: {subtitles.length > 0 ? `${subtitles.length}개 로드됨` : '로딩중...'}
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