import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  ImageList, 
  ImageListItem, 
  Skeleton,
  Paper,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

const GalleryPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  
  // מספר העמודות בהתאם לגודל המסך
  const cols = isMobile ? 1 : isTablet ? 2 : 3;
  
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}${API_ENDPOINTS.rooms.gallery('airport')}`);
        if (response.data && response.data.length > 0) {
          setImages(response.data);
        } else {
          // אם אין תמונות, נייצר גלריה דמה
          const placeholderImages = Array(9).fill().map((_, index) => `placeholder-${index}`);
          setImages(placeholderImages);
        }
      } catch (err) {
        console.error('שגיאה בטעינת תמונות:', err);
        
        // במקרה של שגיאה, נייצר גלריה דמה
        const placeholderImages = Array(9).fill().map((_, index) => `placeholder-${index}`);
        setImages(placeholderImages);
        
        setError('לא ניתן לטעון את התמונות כרגע');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
  }, []);
  
  // פתיחת תמונה בתצוגה מלאה
  const handleImageClick = (image, index) => {
    setSelectedImage(image);
    setImageIndex(index);
  };
  
  // סגירת תצוגה מלאה
  const handleClose = () => {
    setSelectedImage(null);
  };
  
  // מעבר לתמונה הבאה
  const handleNextImage = (e) => {
    e.stopPropagation();
    setImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    setSelectedImage(images[(imageIndex + 1) % images.length]);
  };
  
  // מעבר לתמונה הקודמת
  const handlePrevImage = (e) => {
    e.stopPropagation();
    setImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setSelectedImage(images[(imageIndex - 1 + images.length) % images.length]);
  };
  
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
  
  // רינדור של התמונה הנבחרת בתצוגה מורחבת
  const renderSelectedImage = () => {
    if (!selectedImage) return null;
    
    // בדיקה אם זו תמונה אמיתית או דמה
    if (selectedImage.startsWith('placeholder-')) {
      const index = parseInt(selectedImage.split('-')[1]);
      return (
        <Box
          sx={{
            width: '80vw',
            height: '70vh',
            maxWidth: '1200px',
            maxHeight: '800px',
            background: `linear-gradient(${45 + (index * 30)}deg, #e5e7eb 25%, #d1d5db 25%, #d1d5db 50%, #e5e7eb 50%, #e5e7eb 75%, #d1d5db 75%, #d1d5db 100%)`,
            backgroundSize: '40px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Typography variant="body1" sx={{ backgroundColor: 'rgba(255,255,255,0.9)', p: 2, borderRadius: 2 }}>
            תמונה מייצגת {index + 1}
          </Typography>
        </Box>
      );
    }
    
    // תמונה אמיתית
    return (
      <Box
        component="img"
        src={selectedImage}
        alt="תמונה מוגדלת"
        sx={{
          maxHeight: '90vh',
          maxWidth: '100%',
          objectFit: 'contain',
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  };
  
  return (
    <PublicSiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            to="/airport-booking"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
          >
            חזרה לדף הבית
          </Button>
          
          <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
            גלריית תמונות
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            צפו בתמונות של המלונית, החדרים והסביבה
          </Typography>
        </Box>
        
        {loading ? (
          <Grid container spacing={3}>
            {Array.from(new Array(9)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={240}
                  sx={{ borderRadius: '10px' }}
                />
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              color: 'text.secondary',
              bgcolor: 'rgba(0,0,0,0.04)',
              borderRadius: '10px'
            }}
          >
            {error}
          </Box>
        ) : (
          <ImageList cols={cols} gap={16}>
            {images.map((item, index) => (
              <ImageListItem key={index}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    overflow: 'hidden', 
                    borderRadius: '10px',
                    height: 240,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                  onClick={() => handleImageClick(item, index)}
                >
                  {renderGalleryItem(item, index)}
                </Paper>
              </ImageListItem>
            ))}
          </ImageList>
        )}
        
        {/* דיאלוג תצוגת תמונה מלאה */}
        <Dialog
          open={Boolean(selectedImage)}
          onClose={handleClose}
          maxWidth="lg"
          fullWidth
          fullScreen={isMobile}
          onClick={handleClose}
          PaperProps={{
            sx: { 
              bgcolor: 'rgba(0,0,0,0.9)',
              position: 'relative',
            }
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <DialogContent 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 0,
              position: 'relative',
              height: '100%'
            }}
          >
            {renderSelectedImage()}
            
            {/* כפתורי ניווט */}
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: 'absolute',
                left: 16,
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.5)',
                }
              }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 16,
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.5)',
                }
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </DialogContent>
        </Dialog>
      </Container>
    </PublicSiteLayout>
  );
};

export default GalleryPage; 