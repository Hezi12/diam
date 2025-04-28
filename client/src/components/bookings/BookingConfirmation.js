import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  CircularProgress,
  TextField,
  Grid,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * רכיב להצגת ויצירת אישור הזמנה
 */
const BookingConfirmation = ({ 
  open, 
  onClose, 
  bookingData
}) => {
  // סטייל בסיסי
  const style = {
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    fontFamily: 'Assistant, Arial, sans-serif'
  };

  // צבעי אקסנט
  const accentColors = {
    primary: '#333333',
    secondary: '#555555',
    accent: '#007bff',
    light: '#f8f9fa',
    dark: '#343a40',
    border: '#dee2e6',
    success: '#28a745',
    error: '#dc3545'
  };

  // מצב הערות וטקסט מידע חשוב
  const [notes, setNotes] = useState('');
  const [importantInfo, setImportantInfo] = useState(
    `• מסמך זה מהווה אישור הזמנה רשמי.\n• כניסה למלון החל מהשעה 15:00, יציאה עד השעה 11:00.\n• נא להציג אישור זה בעת ההגעה.`
  );
  
  // מצב טעינה
  const [isLoading, setIsLoading] = useState(false);
  
  // רפרנס לתוכן האישור ורפרנס לגיבוי של התוכן לפני הדפסה
  const confirmationContentRef = useRef(null);
  const printContentRef = useRef(null);

  /**
   * פורמט של תאריך ישראלי
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'd בMMMM yyyy', { locale: he });
    } catch (error) {
      return dateString || 'תאריך לא זמין';
    }
  };

  /**
   * פורמט של מחיר
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  /**
   * יצירת PDF והורדתו
   */
  const generatePDF = async () => {
    if (!confirmationContentRef.current) return;
    
    setIsLoading(true);
    
    try {
      // שמירת מצב נוכחי של הדף למטרת הדפסה
      const originalContent = confirmationContentRef.current.innerHTML;

      // החלפת תיבות הטקסט בערכים שלהן לפני הדפסה
      if (confirmationContentRef.current) {
        const notesElement = confirmationContentRef.current.querySelector('#notes-field');
        const importantInfoElement = confirmationContentRef.current.querySelector('#important-info-field');
        
        if (notesElement) {
          const notesValue = notes.trim() ? notes : "אין הערות";
          const notesText = document.createElement('div');
          notesText.style.whiteSpace = 'pre-wrap';
          notesText.textContent = notesValue;
          notesElement.parentNode.replaceChild(notesText, notesElement);
        }
        
        if (importantInfoElement) {
          const importantInfoText = document.createElement('div');
          importantInfoText.style.whiteSpace = 'pre-wrap';
          importantInfoText.textContent = importantInfo;
          importantInfoElement.parentNode.replaceChild(importantInfoText, importantInfoElement);
        }

        // הסרת שדות ועיצובים עבור הדפסה
        confirmationContentRef.current.querySelectorAll('.MuiOutlinedInput-notchedOutline').forEach(el => {
          el.style.display = 'none';
        });
        
        confirmationContentRef.current.querySelectorAll('.print-hide').forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // לכידת התוכן כתמונה
      const canvas = await html2canvas(confirmationContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        removeContainer: false
      });
      
      // יצירת מסמך PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // שמירת הקובץ
      const fileName = `אישור_הזמנה_${bookingData.firstName || ''}_${bookingData.lastName || ''}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      
      // החזרת התוכן המקורי לדף
      if (confirmationContentRef.current) {
        confirmationContentRef.current.innerHTML = originalContent;
      }
    } catch (error) {
      console.error('שגיאה ביצירת PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !bookingData) return null;

  const checkInDate = bookingData.checkIn ? formatDate(bookingData.checkIn) : 'לא צוין';
  const checkOutDate = bookingData.checkOut ? formatDate(bookingData.checkOut) : 'לא צוין';
  const locationName = bookingData.location === 'airport' ? 'אור יהודה' : 'רוטשילד';
  
  // פרטי העסק בהתאם למיקום ההזמנה
  const businessInfo = {
    name: "דיאם אס הוטלס",
    address: bookingData.location === 'airport' ? "הארז 12, אור יהודה" : "רוטשילד 79, פתח תקווה",
    phone: "050-6070160",
    email: "diamshotels@gmail.com",
    website: "www.diamhotels.co.il"
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ArticleIcon sx={{ mr: 1 }} />
          <Typography variant="h6">אישור הזמנה</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Paper 
          ref={confirmationContentRef}
          sx={{ 
            p: 4, 
            borderRadius: 2,
            mt: 2,
            direction: 'rtl',
            background: '#fff',
            minHeight: '500px'
          }}
        >
          {/* לוגו וכותרת */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {businessInfo.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {businessInfo.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                טלפון: {businessInfo.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                אימייל: {businessInfo.email}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: accentColors.accent }}>
                אישור הזמנה
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                תאריך: {formatDate(new Date())}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                מספר הזמנה: {bookingData.bookingNumber || 'לא צוין'}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* פרטי אורח ללא כותרת */}
          <Typography variant="body1" sx={{ mb: 3 }}>
            שם מלא: {bookingData.firstName} {bookingData.lastName}
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          {/* פרטי ההזמנה */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>פרטי הזמנה</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">אתר:</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {locationName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">סוג חדר:</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {bookingData.roomType || 'לא צוין'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">תאריך כניסה:</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {checkInDate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">תאריך יציאה:</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {checkOutDate}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">מספר לילות:</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {bookingData.nights || '1'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">סה"כ לתשלום:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatPrice(bookingData.price || 0)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* הערות */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>הערות</Typography>
            <TextField
              id="notes-field"
              fullWidth
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              placeholder="הוסף הערות שיופיעו באישור ההזמנה"
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                  },
                }
              }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* מידע חשוב */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>מידע חשוב</Typography>
            <TextField
              id="important-info-field"
              fullWidth
              multiline
              rows={4}
              value={importantInfo}
              onChange={(e) => setImportantInfo(e.target.value)}
              variant="outlined"
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                  },
                }
              }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
          </Box>
          
          {/* חתימה */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body2" color="text.secondary">
              אנו מודים לך על בחירתך בדיאם אס הוטלס ומצפים לארח אותך!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {businessInfo.website} | {businessInfo.phone}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          color="inherit"
        >
          סגירה
        </Button>
        <Button 
          onClick={generatePDF} 
          variant="contained" 
          color="primary"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
          disabled={isLoading}
        >
          {isLoading ? 'מייצר מסמך...' : 'הורדת אישור הזמנה'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingConfirmation; 