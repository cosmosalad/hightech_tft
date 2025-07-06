// TFTEducationPodcast.js
import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, RotateCcw, Headphones, Globe, Mic, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TFTEducationPodcast = ({ onClose }) => {
  const [currentLanguage, setCurrentLanguage] = useState('korean');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  const audioRef = useRef(null);

  const languages = {
    korean: {
      name: '한국어',
      flag: '🇰🇷',
      audioPath: '/data/audio/TFT_kr.mp3',
      description: 'TFT의 기본 원리부터 전기적 특성까지 상세하게 설명합니다',
      aiName: 'TFT 박사',
      color: 'from-blue-500 to-purple-600'
    },
    english: {
      name: 'English',
      flag: '🇺🇸',
      audioPath: '/data/audio/TFT_en.mp3',
      description: 'Comprehensive explanation of TFT principles and electrical characteristics',
      aiName: 'Dr. TFT',
      color: 'from-emerald-500 to-teal-600'
    }
  };

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setAiSpeaking(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
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

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time) => {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[95vh] max-h-[600px] overflow-hidden flex flex-col"
      >
        {/* 헤더 */}
        <div className={`bg-gradient-to-r ${currentLang.color} text-white p-4 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Headphones className="w-6 h-6 mr-2" />
              <div>
                <h2 className="text-xl font-bold">TFT 학습 팟캐스트</h2>
                <p className="text-white/90 text-xs">AI와 함께하는 오디오 학습</p>
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
            <div className="grid grid-cols-2 gap-3">
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
              {aiSpeaking ? '설명 중입니다...' : 'TFT 전문가가 상세하게 설명해드립니다'}
            </p>
          </div>

          {/* 오디오 플레이어 */}
          <div className={`bg-gradient-to-r ${currentLang.color} rounded-xl p-4 text-white shadow-lg`}>
            <audio
              ref={audioRef}
              src={currentLang.audioPath}
              preload="metadata"
            />
            
            {/* 진행 바 */}
            <div className="mb-4">
              <div
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden"
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
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title="처음부터"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50"
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
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none slider"
                />
              </div>
            </div>

            {/* 로딩/상태 표시 */}
            {isLoading && (
              <div className="text-center mt-3">
                <p className="text-white/80 text-xs">오디오를 로딩중...</p>
              </div>
            )}
          </div>

          {/* 학습 팁 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">💡 학습 팁</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 이어폰이나 헤드폰 사용을 권장합니다</li>
              <li>• 중요한 부분은 여러 번 반복해서 들어보세요</li>
            </ul>
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
      `}</style>
    </div>
  );
};

export default TFTEducationPodcast;