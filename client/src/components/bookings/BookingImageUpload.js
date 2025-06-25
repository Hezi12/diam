import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import imageService from '../../services/imageService';

/**
 * קומפוננט להעלאת תמונות להזמנות
 * תומך בעד 2 תמונות עם drag & drop
 */
const BookingImageUpload = ({ 
  bookingId, 
  currentImages = [], 
  onImagesUpdate,
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // מספר התמונות הנוכחי
  const currentImagesCount = currentImages.length;
  const canUploadMore = currentImagesCount < 2;

  // פונקציה לטיפול בקבצים שנבחרו
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!canUploadMore) {
      setError('ניתן להעלות מקסימום 2 תמונות');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // בדיקת תקינות הקבצים
      const filesToUpload = acceptedFiles.slice(0, 2 - currentImagesCount);
      
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
      const result = await imageService.uploadBookingImages(bookingId, filesToUpload);
      
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
      setUploadProgress(0);
    }
  }, [bookingId, currentImagesCount, canUploadMore, onImagesUpdate]);

  // הגדרת dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 2 - currentImagesCount,
    disabled: disabled || uploading || !canUploadMore
  });

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

  // קבלת אייקון לפי סוג קובץ
  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) {
      return <ImageIcon />;
    } else if (mimetype === 'application/pdf') {
      return <PdfIcon />;
    }
    return <FileIcon />;
  };

  return (
    <Box>
      {/* הודעת שגיאה */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* תמונות קיימות */}
      {currentImages.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            תמונות מצורפות ({currentImages.length}/2):
          </Typography>
          <Grid container spacing={1}>
            {currentImages.map((image, index) => (
              <Grid item xs={6} key={index}>
                <Card variant="outlined" sx={{ position: 'relative' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(image.mimetype)}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {image.originalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {imageService.formatFileSize(image.size)}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleImagePreview(index)}
                          title="הצגה"
                        >
                          <ImageIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteImage(index)}
                          color="error"
                          title="מחיקה"
                          disabled={disabled || uploading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* אזור העלאה */}
      {canUploadMore && (
        <Card 
          variant="outlined" 
          sx={{ 
            border: isDragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
            backgroundColor: isDragActive ? '#f3f7ff' : 'transparent',
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            opacity: disabled || uploading ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          <CardContent>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="h6">
                  {isDragActive ? 'שחרר את הקבצים כאן' : 'העלאת תמונות'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  גרור קבצים לכאן או לחץ לבחירה
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Chip size="small" label="JPG" />
                  <Chip size="small" label="PNG" />
                  <Chip size="small" label="GIF" />
                  <Chip size="small" label="PDF" />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  מקסימום {2 - currentImagesCount} קבצים, עד 5MB כל קובץ
                </Typography>
              </Box>
            </div>
          </CardContent>
        </Card>
      )}

      {/* פס התקדמות */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ borderRadius: 1, height: 8 }}
          />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            מעלה קבצים...
          </Typography>
        </Box>
      )}

      {/* הודעה כשיש 2 תמונות */}
      {!canUploadMore && (
        <Alert severity="info" sx={{ mt: 2 }}>
          הגעת למקסימום 2 תמונות. למחק תמונה קיימת כדי להעלות תמונה חדשה.
        </Alert>
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
          <Button onClick={() => setPreviewImage(null)}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingImageUpload; 