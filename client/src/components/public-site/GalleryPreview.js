import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Skeleton,
  useMediaQuery,
  useTheme,
  Typography,
  IconButton
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';
import { usePublicTranslation } from '../../contexts/PublicLanguageContext';

const GalleryPreview = ({ location, limit = 6 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const scrollContainerRef = useRef(null);
  const t = usePublicTranslation();
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // פונקציה לבדיקת אפשרויות גלילה
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // בדיקה אם יש תוכן לגלילה
      const hasScrollableContent = scrollWidth > clientWidth;
      
      // בעברית, החיצים תמיד יופיעו אם יש תוכן לגלילה
      setCanScrollLeft(hasScrollableContent);
      setCanScrollRight(hasScrollableContent);
    }
  };

  // פונקציות גלילה עם לולאה אינסופית
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft: currentScroll, scrollWidth, clientWidth } = scrollContainerRef.current;
      const scrollAmount = isMobile ? 270 : 320; // רוחב תמונה + gap
      
      // גלילה שמאלה (לתמונות קודמות)
      // אם כבר בהתחלה, עבור לסוף
      if (currentScroll <= 10) {
        scrollContainerRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft: currentScroll, scrollWidth, clientWidth } = scrollContainerRef.current;
      const scrollAmount = isMobile ? 270 : 320; // רוחב תמונה + gap
      
      // גלילה ימינה (לתמונות הבאות)
      // אם כבר בסוף, עבור להתחלה
      if (currentScroll >= scrollWidth - clientWidth - 10) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // useEffect לטעינת תמונות
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}${API_ENDPOINTS.rooms.gallery(location)}`);
        // הגבלת מספר התמונות לפי הפרמטר limit
        if (response.data && response.data.length > 0) {
          setImages(response.data.slice(0, limit));
        } else {
          // אם אין תמונות, נייצר גלריה דמה
          const placeholderImages = Array(limit).fill().map((_, index) => `placeholder-${index}`);
          setImages(placeholderImages);
        }
      } catch (err) {
        console.error('שגיאה בטעינת תמונות גלריה:', err);
        
        // במקרה של שגיאה, נייצר גלריה דמה
        const placeholderImages = Array(limit).fill().map((_, index) => `placeholder-${index}`);
        setImages(placeholderImages);
        
        setError(t('gallery.loadingError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, [location, limit]);

  // useEffect לבדיקת כפתורי גלילה
  useEffect(() => {
    // השהיה קטנה לוודא שהתמונות נטענו
    const timeoutId = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    
    const handleScroll = () => checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeoutId);
      };
    }
    
    return () => clearTimeout(timeoutId);
  }, [images, isMobile]);
  
  // סקלטון לטעינה
  if (loading) {
    return (
      <Box sx={{ position: 'relative' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            overflowX: 'hidden',
            pb: 1
          }}
        >
          {Array.from(new Array(limit)).map((_, index) => (
            <Skeleton 
              key={index}
              variant="rectangular" 
              width={isMobile ? 250 : 300} 
              height={200} 
              sx={{ 
                borderRadius: '10px',
                flexShrink: 0
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }
  
  // הודעת שגיאה
  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
        {error}
      </Box>
    );
  }
  
  // אם אין תמונות
  if (images.length === 0) {
    return (
      <Box 
        sx={{ 
          p: 3, 
          textAlign: 'center', 
          color: 'text.secondary',
          bgcolor: 'rgba(0,0,0,0.04)',
          borderRadius: 2
        }}
      >
        {t('gallery.noImages')}
      </Box>
    );
  }
  
  // רינדור של פריט בגלריה (אמיתי או דמה)
  const renderGalleryItem = (item, index) => {
    // בדיקה אם זו תמונה אמיתית או דמה
    if (item.startsWith('placeholder-')) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(${45 + (index * 30)}deg, #e5e7eb 25%, #d1d5db 25%, #d1d5db 50%, #e5e7eb 50%, #e5e7eb 75%, #d1d5db 75%, #d1d5db 100%)`,
            backgroundSize: '20px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body2" sx={{ backgroundColor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1 }}>
            תמונה {index + 1}
          </Typography>
        </Box>
      );
    }
    
    // תמונה אמיתית
    return (
      <Box
        component="img"
        src={item}
        alt={`תמונת גלריה ${index + 1}`}
        loading="lazy"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    );
  }
  
  return (
    <Box sx={{ position: 'relative' }}>
      {/* כפתור גלילה שמאלה - נמצא פיזית בצד שמאל */}
      {canScrollLeft && (
        <IconButton
          onClick={scrollRight}
          sx={{
            position: 'absolute',
            left: -20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
            width: 40,
            height: 40
          }}
        >
          <ChevronLeftIcon sx={{ color: '#475569' }} />
        </IconButton>
      )}

      {/* כפתור גלילה ימינה - נמצא פיזית בצד ימין */}
      {canScrollRight && (
        <IconButton
          onClick={scrollLeft}
          sx={{
            position: 'absolute',
            right: -20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
            width: 40,
            height: 40
          }}
        >
          <ChevronRightIcon sx={{ color: '#475569' }} />
        </IconButton>
      )}

      {/* קונטיינר הגלריה */}
      <Box 
        ref={scrollContainerRef}
        sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto',
          pb: 1,
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none' // Chrome, Safari, Edge
          }
        }}
      >
        {images.map((item, index) => (
          <Paper 
            key={index}
            elevation={2} 
            sx={{ 
              overflow: 'hidden', 
              borderRadius: '10px',
              width: isMobile ? 250 : 300,
              height: 200,
              flexShrink: 0,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
              }
            }}
          >
            {renderGalleryItem(item, index)}
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default GalleryPreview; 