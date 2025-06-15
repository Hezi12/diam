import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Skeleton,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

const GalleryPreview = ({ location, limit = 6 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        
        setError('לא ניתן לטעון את תמונות הגלריה');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, [location, limit]);
  
  // סקלטון לטעינה - שורה אחת
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.5)',
            }
          }
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
        אין תמונות להצגה בגלריה
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
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 2, 
        overflowX: 'auto',
        pb: 1,
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 4,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.5)',
          }
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
  );
};

export default GalleryPreview; 