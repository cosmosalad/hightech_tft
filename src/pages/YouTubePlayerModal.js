import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // framer-motion 임포트

// YouTube URL에서 Embed URL을 추출하는 헬퍼 함수 (이전과 동일)
const getEmbedUrl = (url) => {
  let videoId = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    }
    if (!videoId && url.includes('youtu.be/')) {
       videoId = url.split('youtu.be/')[1].split('?')[0];
    }
  } catch (e) {
    console.error('Invalid URL:', e);
    if (url.includes('youtu.be/')) {
       videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('watch?v=')) {
       videoId = url.split('watch?v=')[1].split('&')[0];
    }
  }
  
  if (!videoId) {
    console.error('Could not extract YouTube video ID from:', url);
    return null;
  }
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`; // 자동 재생 및 음소거 추가 (브라우저 정책)
};

// 애니메이션 Variants 정의
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { type: 'spring', stiffness: 300, damping: 25 } 
  },
  exit: { scale: 0.9, opacity: 0, transition: { duration: 0.2 } },
};

const YouTubePlayerModal = ({ videoUrl, isOpen, onClose }) => {
  const embedUrl = getEmbedUrl(videoUrl);

  // 'Escape' 키 눌렀을 때 닫기
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // 모달 바깥(백드롭) 클릭 시 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && embedUrl && (
        // 백드롭
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick} // 백드롭 클릭 이벤트
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* 모달 컨텐츠 */}
          <motion.div
            className="bg-black rounded-2xl shadow-2xl max-w-4xl w-full relative overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10 p-1 bg-black/30 rounded-full"
              aria-label="Close video player"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* 반응형 비디오 컨테이너 */}
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default YouTubePlayerModal;