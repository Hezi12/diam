import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Close as CloseIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import imageService from '../../services/imageService';

/**
 * קומפוננט מינימליסטי להעלאת תמונות - מתאים לשילוב בשורת מחירים
 */
const BookingImagesMini = ({ 
  bookingId, 
  currentImages = [], 
  onImagesUpdate,
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // מספר התמונות הנוכחי
  const currentImagesCount = currentImages.length;
  const canUploadMore = currentImagesCount < 2;

  // לוג לבדיקה
  console.log('🖼️ BookingImagesMini rendered:', { 
    bookingId, 
    currentImagesCount, 
    canUploadMore, 
    disabled 
  });

  // פונקציה לטיפול בבחירת קבצים
  const handleFileSelect = async (event) => {
    console.log('🎯 handleFileSelect called!');
    const files = event.target.files;
    console.log('🔍 Debug - bookingId:', bookingId);
    console.log('🔍 Debug - files:', files);
    
    if (!files || files.length === 0) return;

    if (!bookingId) {
      setError('אין מזהה הזמנה - לא ניתן להעלות תמונות');
      return;
    }

    if (!canUploadMore) {
      setError('ניתן להעלות מקסימום 2 תמונות');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // בדיקת תקינות הקבצים
      const filesToUpload = Array.from(files).slice(0, 2 - currentImagesCount);
      
      for (const file of filesToUpload) {
        const validation = imageService.validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }

      // בדיקת מספר קבצים
      const countValidation = imageService.validateFilesCount(filesToUpload, currentImagesCount);
      if (!countValidation.isValid) {
        throw new Error(countValidation.error);
      }

      // העלאת הקבצים
      await imageService.uploadBookingImages(bookingId, filesToUpload);
      
      // עדכון הרשימה
      if (onImagesUpdate) {
        onImagesUpdate();
      }

      console.log('✅ תמונות הועלו בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בהעלאת תמונות:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }

    // איפוס input
    event.target.value = '';
  };

  // מחיקת תמונה
  const handleDeleteImage = async (imageIndex) => {
    try {
      setError(null);
      await imageService.deleteBookingImage(bookingId, imageIndex);
      
      if (onImagesUpdate) {
        onImagesUpdate();
      }
      
      console.log('✅ תמונה נמחקה בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה במחיקת תמונה:', error);
      setError(error.message);
    }
  };

  // תצוגת תמונה
  const handleImagePreview = (imageIndex) => {
    const imageUrl = imageService.getBookingImageUrl(bookingId, imageIndex);
    setPreviewImage({ url: imageUrl, index: imageIndex });
  };

  // הורדת תמונה
  const handleDownloadImage = async (imageIndex) => {
    try {
      setError(null);
      const image = currentImages[imageIndex];
      const filename = image?.originalName || `booking-${bookingId}-image-${imageIndex + 1}`;
      
      await imageService.downloadBookingImage(bookingId, imageIndex, filename);
      
      console.log('✅ תמונה הורדה בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בהורדת תמונה:', error);
      setError(error.message);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {/* הודעת שגיאה */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'absolute', 
            top: -60, 
            right: 0, 
            zIndex: 1000,
            fontSize: '0.75rem',
            py: 0.5
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* תמונות קיימות - thumbnails קטנים */}
      {currentImages.map((image, index) => {
        const imageUrl = imageService.getBookingImageUrl(bookingId, index);
        console.log(`🖼️ Rendering image ${index}:`, { 
          imageUrl, 
          image, 
          bookingId,
          fullUrl: window.location.origin + imageUrl 
        });
        
        return (
          <Tooltip key={index} title={`תמונה ${index + 1} - לחץ לתצוגה מלאה`}>
            <Box 
              sx={{ 
                position: 'relative',
                width: 32,
                height: 32,
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid #ddd',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }
              }}
            >
            {/* תמונה */}
            <img 
              src={imageUrl}
              alt={`תמונה ${index + 1}`}
              onClick={() => handleImagePreview(index)}
              onError={(e) => {
                console.error(`❌ Failed to load image ${index}:`, imageUrl);
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.display = 'flex';
                e.target.style.alignItems = 'center';
                e.target.style.justifyContent = 'center';
                e.target.innerHTML = '❌';
              }}
              onLoad={() => {
                console.log(`✅ Image ${index} loaded successfully:`, imageUrl);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            {/* כפתור הורדה */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage(index);
              }}
              disabled={disabled || uploading}
              sx={{
                position: 'absolute',
                top: -4,
                left: -4,
                width: 16,
                height: 16,
                bgcolor: 'info.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'info.dark'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 10
                }
              }}
            >
              <DownloadIcon />
            </IconButton>
            
            {/* כפתור מחיקה */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteImage(index);
              }}
              disabled={disabled || uploading}
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'error.dark'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 12
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Tooltip>
        );
      })}

      {/* כפתור הוספת תמונה */}
      {canUploadMore && (
        <Tooltip title={`העלה תמונה (${currentImagesCount}/2)`}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <IconButton
              component="label"
              size="small"
              disabled={disabled || uploading}
              sx={{
                width: 32,
                height: 32,
                border: '1px dashed #ccc',
                borderRadius: 1,
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50'
                },
                '&:disabled': {
                  opacity: 0.5
                }
              }}
            >
              <AddPhotoIcon sx={{ fontSize: 16 }} />
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileSelect}
                disabled={disabled || uploading}
                hidden
              />
            </IconButton>
          </Box>
        </Tooltip>
      )}

      {/* דיאלוג תצוגת תמונה */}
      <Dialog 
        open={!!previewImage} 
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          תצוגת תמונה
          <IconButton onClick={() => setPreviewImage(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewImage && (
            <Box sx={{ textAlign: 'center' }}>
              <img 
                src={previewImage.url} 
                alt={`תמונה ${previewImage.index + 1}`}
                onError={(e) => {
                  console.error('❌ Failed to load preview image:', previewImage.url);
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ Preview image loaded:', previewImage.url);
                }}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (previewImage) {
                handleDownloadImage(previewImage.index);
              }
            }}
            variant="outlined"
          >
            הורד תמונה
          </Button>
          <Button onClick={() => setPreviewImage(null)}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingImagesMini; 