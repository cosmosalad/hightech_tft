import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, RotateCcw, Headphones, Globe, Mic, MessageCircle, AlertCircle } from 'lucide-react';

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

  const getAudioUrl = (filename) => {
    return `https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/data/audio/${filename}`;
  };

  const getSubtitleUrl = (filename) => {
    return `https://raw.githubusercontent.com/cosmosalad/hightech_tft/main/data/audio/${filename}`;
  };

  const languages = {
    korean: {
      name: '한국어',
      flag: '🇰🇷',
      audioPath: getAudioUrl('TFT_kr.mp3'),
      subtitlePath: getSubtitleUrl('TFT_kr.srt'),
      description: 'TFT 기본 원리 설명',
      aiName: 'TFT 연구팀',
      color: 'from-emerald-500 to-teal-600'
    },
    english: {
      name: 'English',
      flag: '🇺🇸',
      audioPath: getAudioUrl('TFT_en.mp3'),
      subtitlePath: getSubtitleUrl('TFT_en.srt'),
      description: 'TFT Principles Explained',
      aiName: 'TFT Research Team',
      color: 'from-blue-500 to-purple-600'
    },
    japanese: {
      name: '日本語',
      flag: '🇯🇵',
      audioPath: getAudioUrl('TFT_jp.mp3'),
      subtitlePath: getSubtitleUrl('TFT_jp.srt'),
      description: 'TFT基本原理',
      aiName: 'TFT 研究团队',
      color: 'from-purple-500 to-indigo-600'
    },
    chinese: {
      name: '中文',
      flag: '🇨🇳',
      audioPath: getAudioUrl('TFT_cn.mp3'),
      subtitlePath: getSubtitleUrl('TFT_cn.srt'),
      description: 'TFT基本原理',
      aiName: 'TFT研究チーム',
      color: 'from-red-500 to-pink-600'
    }
  };

  const parseSRT = (srtText) => {
    const blocks = srtText.trim().split('\n\n');
    return blocks.map(block => {
      const lines = block.trim().split('\n');
      if (lines.length < 3) return null;
      
      const timeString = lines[1];
      const text = lines.slice(2).join('\n');
      
      const timeMatch = timeString.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeMatch) return null;
      
      const startTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
      const endTime = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
      
      return {
        startTime,
        endTime,
        text: text.replace(/<[^>]+>/g, '')
      };
    }).filter(Boolean);
  };

  const loadSubtitles = async (subtitleUrl) => {
    try {
      setSubtitleError(null);
      const response = await fetch(subtitleUrl);
      if (!response.ok) {
        throw new Error(`자막 파일을 불러올 수 없습니다: ${response.status}`);
      }
      const srtText = await response.text();
      const parsedSubtitles = parseSRT(srtText);
      setSubtitles(parsedSubtitles);
    } catch (error) {
      console.error('Subtitle loading error:', error);
      setSubtitleError('자막을 불러오는데 실패했습니다.');
      setSubtitles([]);
    }
  };

  const clearAllTimersAndStates = () => {
    wordTimersRef.current.forEach(timer => clearTimeout(timer));
    wordTimersRef.current = [];
    setCurrentSubtitle('');
    setCurrentSubtitleIndex(-1);
    setVisibleWords([]);
    lastSubtitleRef.current = null;
  };

  const splitTextByLanguage = (text, language) => {
    if (!text) return [];
    
    switch (language) {
      case 'korean':
      case 'english':
        return text.split(' ').filter(word => word.trim() !== '');
      
      case 'japanese':
        if (text.includes(' ')) {
          return text.split(' ').filter(word => word.trim() !== '');
        } else {
          return text.match(/[\u3040-\u309F]+|[\u30A0-\u30FF]+|[\u4E00-\u9FAF]+|[A-Za-z0-9]+|[^\s]/g) || [text];
        }
      
      case 'chinese':
        return text.split('');
      
      default:
        return text.split(' ').filter(word => word.trim() !== '');
    }
  };

  const showWordsSequentially = (text, startTime, endTime, currentTime) => {
    clearAllTimersAndStates();
    if (!text || !isPlaying) {
      return;
    }
    const words = splitTextByLanguage(text, currentLanguage);
    const totalDuration = endTime - startTime;
    const wordAnimationDuration = totalDuration > 1 ? totalDuration - 1.0 : totalDuration;
    const timePerWord = words.length > 0 ? wordAnimationDuration / words.length : 0;
    const elapsedTime = currentTime - startTime;
    const minInterval = 0.15;
    const maxInterval = 0.6;
    const adjustedTimePerWord = Math.max(minInterval, Math.min(timePerWord, maxInterval));

    if (elapsedTime >= wordAnimationDuration || wordAnimationDuration <= 0) {
      const allWords = words.map((word, index) => ({ word, index }));
      setVisibleWords(allWords);
      return;
    }

    const wordsToShowImmediately = adjustedTimePerWord > 0 ? Math.floor(elapsedTime / adjustedTimePerWord) : words.length;
    const initialWords = words.slice(0, Math.min(wordsToShowImmediately + 1, words.length)).map((word, index) => ({ word, index }));
    setVisibleWords(initialWords);

    words.slice(wordsToShowImmediately + 1).forEach((word, index) => {
      const actualIndex = wordsToShowImmediately + 1 + index;
      let showTime = (adjustedTimePerWord * actualIndex - elapsedTime) * 1000;
      const smoothDelay = 120 + (index * 80);
      showTime = Math.max(showTime, smoothDelay);
      
      const timeUntilComplete = (wordAnimationDuration - elapsedTime) * 1000;
      
      if (showTime > 0 && showTime < timeUntilComplete && actualIndex < words.length) {
        const timer = setTimeout(() => {
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

    const timeToShowAll = (wordAnimationDuration - elapsedTime) * 1000;
    if (timeToShowAll > 0) {
      const completeTimer = setTimeout(() => {
        if (isPlaying) {
          const allWords = words.map((word, index) => ({ word, index }));
          setVisibleWords(allWords);
        }
      }, timeToShowAll);
      wordTimersRef.current.push(completeTimer);
    }
  };

  const updateCurrentSubtitle = (currentTime) => {
    if (subtitles.length === 0 || !isPlaying) {
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      updateCurrentSubtitle(audio.currentTime);
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
      setAudioError('오디오 파일을 불러올 수 없습니다.');
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
      clearAllTimersAndStates();
    };
  }, [currentLanguage, subtitles, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      setAiSpeaking(true);
    } else {
      setAiSpeaking(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    setAudioError(null);
    setSubtitleError(null);
    clearAllTimersAndStates();
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setAiSpeaking(false);
    }
    
    setCurrentTime(0);
    setDuration(0);
    setSubtitles([]);
    
    const currentLang = languages[currentLanguage];
    if (currentLang && currentLang.subtitlePath) {
      loadSubtitles(currentLang.subtitlePath);
    }
  }, [currentLanguage]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
  
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      wordTimersRef.current.forEach(timer => clearTimeout(timer));
      wordTimersRef.current = [];
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            updateCurrentSubtitle(audio.currentTime);
          })
          .catch((error) => {
            console.error('Play failed:', error);
            setAudioError('재생에 실패했습니다.');
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
    if (isPlaying) {
        updateCurrentSubtitle(newTime);
    } else {
        const currentSubIndex = subtitles.findIndex(sub => newTime >= sub.startTime && newTime <= sub.endTime);
        if (currentSubIndex !== -1) {
            const currentSub = subtitles[currentSubIndex];
            clearAllTimersAndStates();
            setCurrentSubtitle(currentSub.text);
            const words = splitTextByLanguage(currentSub.text, currentLanguage);
            setVisibleWords(words.map((word, index) => ({word, index})));
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
            setAudioError('재생에 실패했습니다.');
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
      audio.load();
    }
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
        {}
        <div className={`bg-gradient-to-r ${currentLang.color} text-white p-3 flex-shrink-0 transition-all duration-500 ease-in-out`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Headphones className="w-5 h-5 mr-2" />
              <div>
                <h2 className="text-lg font-bold">TFT 학습 팟캐스트</h2>
                <p className="text-white/90 text-xs">대화형 TFT 지식 탐구</p>
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

        <div className="flex-1 flex overflow-hidden">
          {}
          <div className="w-1/3 p-3 border-r bg-gray-50 overflow-hidden">
            {}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                언어 선택
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(languages).map(([key, lang]) => (
                  <button
                    key={key}
                    onClick={() => setCurrentLanguage(key)}
                    className={`p-2 rounded-lg border-2 transition-all duration-300 min-w-0 ${
                      currentLanguage === key
                        ? `border-blue-500 bg-gradient-to-r ${lang.color} text-white shadow-lg`
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-center mb-1 justify-center">
                      <span className="text-sm mr-1">{lang.flag}</span>
                      <span className="font-semibold text-xs truncate">{lang.name}</span>
                    </div>
                    <p className={`text-xs truncate ${currentLanguage === key ? 'text-white/90' : 'text-gray-600'}`}>
                      {lang.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="text-center">
              <div className="relative mb-4">
                <div className={`absolute inset-0 bg-gradient-to-r ${currentLang.color} rounded-2xl blur-xl opacity-20 scale-110 transition-all duration-500 ease-in-out`}></div>
                
                <div className={`relative bg-gradient-to-br ${currentLang.color} rounded-2xl p-4 shadow-lg border border-white/20 transition-all duration-500 ease-in-out`}>
                  {}
                  <div className="flex items-center justify-center mb-3">
                    <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${audioError ? 'bg-red-400' : aiSpeaking ? 'bg-green-400' : 'bg-gray-300'}`}>
                        {aiSpeaking && (
                          <div
                            className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                          />
                        )}
                      </div>
                      <span className="text-white/90 text-xs font-medium">
                        {audioError ? 'Offline' : aiSpeaking ? 'Speaking' : 'Ready'}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="relative h-20 mb-3 overflow-hidden">
                    {}
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className={`absolute bg-white/40 rounded-full transition-all duration-300 ${
                          aiSpeaking ? 'animate-[waveform_1.5s_ease-in-out_infinite]' : ''
                        }`}
                        style={{
                          left: `${15 + i * 12}%`,
                          top: '50%',
                          width: '2px',
                          height: aiSpeaking 
                            ? `${20 + Math.sin(i * 0.5) * 15}px`
                            : '6px',
                          transform: 'translateY(-50%)',
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}

                    {}
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={`reverse-${i}`}
                        className={`absolute bg-white/40 rounded-full transition-all duration-300 ${
                          aiSpeaking ? 'animate-[waveform_1.8s_ease-in-out_infinite]' : ''
                        }`}
                        style={{
                          right: `${15 + i * 12}%`,
                          top: '50%',
                          width: '2px',
                          height: aiSpeaking 
                            ? `${25 + Math.sin(i * 0.7 + Math.PI) * 20}px`
                            : '6px',
                          transform: 'translateY(-50%)',
                          animationDelay: `${i * 0.15}s`
                        }}
                      />
                    ))}

                    {}
                    {aiSpeaking && Array.from({ length: 3 }, (_, i) => (
                      <div
                        key={`ripple-${i}`}
                        className="absolute top-1/2 left-1/2 border border-white/30 rounded-full animate-[ripple_3s_ease-out_infinite]"
                        style={{
                          width: '32px',
                          height: '32px',
                          marginLeft: '-16px',
                          marginTop: '-16px',
                          animationDelay: `${i * 1}s`
                        }}
                      />
                    ))}

                    {}
                    {aiSpeaking && (
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-1 h-6">
                        {Array.from({ length: 15 }, (_, i) => (
                          <div
                            key={`spectrum-${i}`}
                            className="bg-white/30 rounded-t-sm animate-[spectrum_0.8s_ease-in-out_infinite]"
                            style={{ 
                              width: '1px',
                              height: `${5 + Math.sin(i * 0.8) * 8}px`,
                              animationDelay: `${i * 0.05}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {}
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-white mb-1">{currentLang.aiName}</h4>
                    <p className="text-white/90 text-xs">
                      {audioError ? 'Audio System Offline' : 
                       aiSpeaking ? 'AI Processing...' : 
                       'TFT Analysis Ready'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="p-2 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
              <h4 className="font-semibold text-gray-800 mb-1 text-xs flex items-center">
                💡 학습 팁
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="truncate">• 이어폰 사용 권장</div>
                <div className="truncate">• 자막과 함께 학습</div>
                <div className="truncate">• 반복 재생으로 이해도 향상</div>
              </div>
            </div>
          </div>

          {}
          <div className="flex-1 flex flex-col p-3 min-w-0 overflow-hidden">
            {}
            <div className="bg-gray-900 rounded-xl p-4 flex-1 flex items-center justify-center mb-3 min-h-0 relative">
              {}
              {isLoading && !audioError && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 animate-[fadeIn_0.3s_ease-out] transition-all duration-300">
                  <div className="text-center">
                    <p className="text-white/90 text-sm mb-2">GitHub에서 콘텐츠를 로딩중...</p>
                    <div className="flex justify-center space-x-1">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-white/60 rounded-full animate-[loadingDot_1.4s_ease-in-out_infinite]"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`w-full max-w-3xl h-full flex items-center justify-center transition-all duration-500 ${isLoading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
                {subtitleError ? (
                  <p className="text-red-400 text-sm text-center animate-[fadeIn_0.5s_ease-out]">{subtitleError}</p>
                ) : visibleWords.length > 0 ? (
                  <div className="text-white text-base leading-relaxed text-left w-full animate-[fadeIn_0.5s_ease-out]">
                    {visibleWords.map((wordObj, index) => (
                      <span
                        key={`${currentLanguage}-${currentSubtitleIndex}-${wordObj.index}`}
                        className="inline-block mb-1 relative opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
                        style={{
                          marginRight: currentLanguage === 'korean' || currentLanguage === 'english' ? '0.4rem' : '0.1rem',
                          animationDelay: `${index * 0.02}s`
                        }}
                      >
                        <span className="relative z-10">{wordObj.word}</span>
                        <div
                          className="absolute inset-0 bg-blue-500/20 rounded opacity-0 animate-[highlight_0.6s_ease-out_forwards]"
                          style={{ animationDelay: `${index * 0.05 + 0.05}s` }}
                        />
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center animate-[fadeIn_0.5s_ease-out]">
                    <div className="text-gray-400 text-sm">
                      {isPlaying ? '자막을 로딩중입니다...' : '재생을 시작하면 자막이 표시됩니다'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {}
            {audioError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{audioError}</p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="ml-2 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded transition-colors"
                  >
                    재시도
                  </button>
                </div>
              </div>
            )}

            {}
            <div className={`bg-gradient-to-r ${currentLang.color} rounded-xl p-3 text-white shadow-lg transition-all duration-500 ease-in-out ${audioError ? 'opacity-50' : ''} flex-shrink-0`}>
              <audio
                ref={audioRef}
                src={currentLang.audioPath}
                preload="metadata"
                crossOrigin="anonymous"
              />
              
              {}
              <div className="mb-3">
                <div
                  className={`w-full h-2 bg-white/20 rounded-full overflow-hidden relative ${audioError ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-white rounded-full relative transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    {isPlaying && (
                      <div className="absolute right-0 top-0 h-full w-4 bg-white/50 rounded-full blur-sm"></div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs mt-1 text-white/80 min-w-0">
                  <span className="flex-shrink-0">{formatTime(currentTime)}</span>
                  <span className="flex-shrink-0">{formatTime(duration)}</span>
                </div>
              </div>

              {}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={handleRestart}
                  disabled={audioError}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                  title="처음부터"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePlayPause}
                  disabled={isLoading || audioError}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm relative overflow-hidden"
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
                    style={{ '--volume-percent': `${volume * 100}%` }}
                  />
                </div>
              </div>

              {}
            </div>

            {}
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 mt-3 flex-shrink-0 min-h-[3rem]">
              <div className="flex items-center justify-between h-full">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-blue-700 flex items-center">
                    <span className="font-semibold flex-shrink-0">🔗 소스:</span> 
                    <span className="ml-1 truncate">GitHub Repository</span>
                  </p>
                  <p className="text-xs text-blue-600 truncate">
                    <span className="flex-shrink-0">{currentLang.name} ({currentLang.flag}) |</span>
                    <span className="ml-1">자막: {subtitles.length > 0 ? `${subtitles.length}개` : '로딩중...'}</span>
                  </p>
                </div>
                <div className="text-blue-500 animate-spin flex-shrink-0 ml-2" style={{ animationDuration: '20s' }}>
                  ⚙️
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .slider {
          position: relative;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          position: relative;
          z-index: 2;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          position: relative;
          z-index: 2;
        }
        
        .slider:disabled::-webkit-slider-thumb {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .slider:disabled::-moz-range-thumb {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .slider::-webkit-slider-track {
          height: 4px;
          border-radius: 2px;
          background: transparent;
        }
        
        .slider::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: transparent;
          border: none;
        }
        
        /* 진행 바를 위한 가상 요소 */
        .slider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          height: 4px;
          border-radius: 2px;
          background: white;
          transform: translateY(-50%);
          width: var(--volume-percent, 80%);
          z-index: 1;
          pointer-events: none;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes highlight {
          from {
            opacity: 0;
            transform: scaleX(0);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }
        
        @keyframes loadingDot {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes waveform {
          0%, 100% {
            height: 6px;
          }
          25% {
            height: 25px;
          }
          50% {
            height: 15px;
          }
          75% {
            height: 30px;
          }
        }
        
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }
        
        @keyframes spectrum {
          0%, 100% {
            height: 3px;
          }
          50% {
            height: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default TFTEducationPodcast;