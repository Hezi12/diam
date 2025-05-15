import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Skeleton,
  ImageList,
  ImageListItem,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

const GalleryPreview = ({ location, limit = 6 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // מספר העמודות בהתאם לגודל המסך
  const cols = isMobile ? 1 : isTablet ? 2 : 3;
  
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
  
  // סקלטון לטעינה
  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from(new Array(limit)).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Skeleton variant="rectangular" width="100%" height={200} />
          </Grid>
        ))}
      </Grid>
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
    <ImageList sx={{ overflow: 'hidden' }} cols={cols} gap={16}>
      {images.map((item, index) => (
        <ImageListItem key={index}>
          <Paper 
            elevation={2} 
            sx={{ 
              overflow: 'hidden', 
              borderRadius: '10px',
              height: '200px',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              }
            }}
          >
            {renderGalleryItem(item, index)}
          </Paper>
        </ImageListItem>
      ))}
    </ImageList>
  );
};

export default GalleryPreview; 