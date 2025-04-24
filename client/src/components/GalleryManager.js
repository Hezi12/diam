import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Paper, Grid, Divider, useMediaQuery, useTheme,
  CircularProgress, Alert
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';

const GalleryManager = ({ location, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const locationName = location === 'airport' ? 'שדה התעופה' : 'רוטשילד';

  // טעינת התמונות כאשר הממשק נפתח
  useEffect(() => {
    if (open) {
      fetchGalleryImages();
    }
  }, [open, location]);

  // קבלת תמונות הגלריה מהשרת
  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/rooms/gallery/${location}`);
      setImages(response.data);
      // איפוס של תמונות חדשות
      setNewFiles([]);
      setPreviewImages([]);
    } catch (err) {
      console.error('שגיאה בטעינת תמונות הגלריה:', err);
      setError('שגיאה בטעינת תמונות הגלריה. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  // טיפול בהעלאת תמונות חדשות
  const handleUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // יצירת תצוגות מקדימות
    const filePreviews = files.map(file => URL.createObjectURL(file));
    
    setNewFiles((prev) => [...prev, ...files]);
    setPreviewImages((prev) => [...prev, ...filePreviews]);
  };

  // טיפול במחיקת תמונה קיימת
  const handleDeleteExisting = async (index, imageUrl) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
      try {
        setLoading(true);
        
        // קבלת מזהה התמונה מה-URL
        // בדרך כלל URL של תמונה נראה משהו כמו:
        // http://localhost:3200/uploads/gallery/airport/1745405467199-1885057d-6f35-4b25-a533-523f36499842.JPG
        // אבל אנחנו צריכים את ה-ID מהמסד נתונים
        
        // ראשית נקבל את כל פרטי הגלריה
        const galleryResponse = await axios.get(`/api/rooms/gallery/${location}/details`);
        const galleryItems = galleryResponse.data;
        
        // מציאת הפריט עם ה-URL המתאים
        const galleryItem = galleryItems.find(item => item.imageUrl === imageUrl);
        
        if (!galleryItem) {
          throw new Error('לא נמצאה תמונה מתאימה במסד הנתונים');
        }
        
        // שליחת בקשת מחיקה לשרת
        await axios.delete(`/api/rooms/gallery/${galleryItem._id}`);
        
        // מחיקת התמונה מהממשק
        setImages(prev => prev.filter((_, i) => i !== index));
        
        alert('התמונה נמחקה בהצלחה');
      } catch (err) {
        console.error('שגיאה במחיקת תמונה:', err);
        setError('שגיאה במחיקת התמונה. אנא נסה שוב.');
      } finally {
        setLoading(false);
      }
    }
  };

  // טיפול במחיקת תמונה חדשה
  const handleDeleteNew = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  // שמירת השינויים
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // העלאת כל התמונות החדשות לשרת
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await axios.post(`/api/rooms/gallery/${location}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data.imageUrl;
      });
      
      // המתנה להשלמת כל ההעלאות
      const uploadedImageUrls = await Promise.all(uploadPromises);
      
      // עדכון התמונות בממשק
      setImages(prev => [...prev, ...uploadedImageUrls]);
      setNewFiles([]);
      setPreviewImages([]);
      
      alert('התמונות נשמרו בהצלחה');
      // רענון הגלריה מהשרת (אופציונלי)
      await fetchGalleryImages();
      
      onClose();
    } catch (err) {
      console.error('שגיאה בשמירת התמונות:', err);
      setError('שגיאה בשמירת התמונות. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          pb: 1
        }}
      >
        <Typography variant="h6">
          גלריית תמונות - {locationName}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 2 }}>
        <Typography variant="body1" paragraph>
          ניהול תמונות הגלריה הכללית של מקום האירוח. תמונות אלה יוצגו באתר ההזמנות.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ my: 2 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{ 
              bgcolor: '#0071e3', 
              '&:hover': { bgcolor: '#0062c3' }
            }}
            disabled={loading}
          >
            העלה תמונות חדשות
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleUpload}
            />
          </Button>
        </Box>
        
        {previewImages.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
              תמונות חדשות להוספה
            </Typography>
            
            <Grid container spacing={2}>
              {previewImages.map((src, index) => (
                <Grid item key={index} xs={6} sm={4} md={3}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.12)',
                      aspectRatio: '4/3'
                    }}
                  >
                    <img 
                      src={src} 
                      alt={`תמונה חדשה ${index+1}`} 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 5, 
                        right: 5,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.9)',
                        }
                      }}
                      onClick={() => handleDeleteNew(index)}
                      disabled={loading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          תמונות קיימות בגלריה
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {images.length > 0 ? (
              images.map((src, index) => (
                <Grid item key={index} xs={6} sm={4} md={3}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.12)',
                      aspectRatio: '4/3'
                    }}
                  >
                    <img 
                      src={src} 
                      alt={`תמונה ${index+1}`} 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 5, 
                        right: 5,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.9)',
                        }
                      }}
                      onClick={() => handleDeleteExisting(index, src)}
                      disabled={loading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  אין תמונות בגלריה. ניתן להעלות תמונות חדשות באמצעות הכפתור "העלה תמונות חדשות".
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ borderRadius: 1.5 }}
          disabled={loading}
        >
          ביטול
        </Button>
        {previewImages.length > 0 && (
          <Button 
            onClick={handleSave} 
            variant="contained"
            sx={{ 
              bgcolor: '#0071e3', 
              '&:hover': { bgcolor: '#0062c3' },
              borderRadius: 1.5
            }}
            disabled={loading}
          >
            {loading ? 'שומר...' : 'שמור שינויים'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GalleryManager; 