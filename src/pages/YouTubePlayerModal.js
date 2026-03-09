import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
};

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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && embedUrl && (
        (<motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {}
          <motion.div
            className="bg-black rounded-2xl shadow-2xl max-w-4xl w-full relative overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors z-10 p-1 bg-black/30 rounded-full"
              aria-label="Close video player"
            >
              <X className="w-6 h-6" />
            </button>
            
            {}
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
        </motion.div>)
      )}
    </AnimatePresence>
  );
};

export default YouTubePlayerModal;