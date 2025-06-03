/**
 * דיאלוג לסליקת כרטיס אשראי
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import { useSnackbar } from 'notistack';
import icountService from '../../services/icountService';

const CreditCardChargeDialog = ({ open, onClose, booking }) => {
  // מצב טעינה ותוצאות
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [chargeAmount, setChargeAmount] = useState(booking?.price || 0);
  
  // הוק להודעות
  const { enqueueSnackbar } = useSnackbar();
  
  // עדכון הסכום כאשר ההזמנה משתנה
  React.useEffect(() => {
    if (booking?.price && !result) {
      setChargeAmount(booking.price);
    }
  }, [booking?.price, result]);
  
  // איפוס הדיאלוג בעת סגירה
  const handleClose = () => {
    if (!loading) {
      setResult(null);
      setError(null);
      setChargeAmount(booking?.price || 0);
      onClose();
    }
  };
  
  // ביצוע הסליקה
  const handleCharge = async () => {
    // בדיקות תקינות לפני התחלת התהליך
    if (!booking || !booking._id) {
      setError('פרטי הזמנה חסרים');
      return;
    }
    
    if (!booking.creditCard || !booking.creditCard.cardNumber) {
      setError('פרטי כרטיס אשראי חסרים בהזמנה');
      return;
    }
    
    if (!chargeAmount || chargeAmount <= 0) {
      setError('יש להזין סכום תקין לחיוב');
      return;
    }

    // בדיקת תקינות מספר כרטיס (בסיסית)
    const cleanCardNumber = booking.creditCard.cardNumber.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      setError('מספר כרטיס אשראי לא תקין');
      return;
    }

    // בדיקת תוקף
    if (!booking.creditCard.expiryDate) {
      setError('תוקף כרטיס אשראי חסר');
      return;
    }

    // בדיקת פורמט תוקף - תמיכה בפורמטים שונים
    const cleanExpiryDate = booking.creditCard.expiryDate.replace(/\s|-/g, '');
    const isValidFormat = /^(0[1-9]|1[0-2])\/?\d{2}$/.test(cleanExpiryDate) || // MM/YY או MMYY
                         /^(0[1-9]|1[0-2])\d{2}$/.test(cleanExpiryDate) || // MMYY
                         /^\d{2}\/\d{2}$/.test(cleanExpiryDate) || // YY/MM (בטעות)
                         /^\d{4}$/.test(cleanExpiryDate); // MMYY
    
    if (!isValidFormat) {
      setError('תוקף כרטיס אשראי לא תקין');
      return;
    }

    // בדיקת CVV
    if (!booking.creditCard.cvv || !/^\d{3,4}$/.test(booking.creditCard.cvv)) {
      setError('CVV לא תקין (נדרשות 3-4 ספרות)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('🔄 מתחיל תהליך סליקת אשראי...');
      
      // קריאה אמיתית לשרת
      const response = await icountService.chargeCard(booking.location, booking._id, chargeAmount);
      
      console.log('✅ תגובה מהשרת:', response);
      
      if (response.success) {
        console.log(`🎉 סליקה הושלמה בהצלחה! מספר עסקה: ${response.transactionId}`);
        
        // בניית הודעת הצלחה מפורטת
        let successMessage = `סליקה בוצעה בהצלחה!\n`;
        successMessage += `מספר עסקה: ${response.transactionId}\n`;
        successMessage += `סכום: ${response.amount} ₪\n`;
        successMessage += `סוג כרטיס: ${response.cardType}`;
        
        // הוספת מידע על חשבונית אם נוצרה
        if (response.invoice && response.invoice.success) {
          successMessage += `\n📄 חשבונית נוצרה: ${response.invoice.invoiceNumber}`;
          console.log(`📄 חשבונית נוצרה בהצלחה: ${response.invoice.invoiceNumber}`);
        } else if (response.invoice) {
          successMessage += `\n⚠️ חשבונית לא נוצרה (סליקה בוצעה בהצלחה)`;
          console.log(`⚠️ חשבונית לא נוצרה אך הסליקה הצליחה`);
        }
        
        setResult({
          success: true,
          transactionId: response.transactionId,
          amount: response.amount,
          cardType: response.cardType,
          invoice: response.invoice,
          message: successMessage
        });
        
        // הודעת הצלחה קצרה לסנקבר
        const shortMessage = `סליקה בוצעה בהצלחה! מספר עסקה: ${response.transactionId}`;
        enqueueSnackbar(shortMessage, { variant: 'success' });
        
        // סגירת הדיאלוג אחרי 3 שניות
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(response.message || 'סליקה נכשלה');
      }
      
    } catch (error) {
      console.error('❌ שגיאה בקריאה לשרת:', error);
      
      let errorMessage;
      if (error.message === 'Failed to fetch') {
        errorMessage = 'בעיה בחיבור לשרת - בדוק חיבור לאינטרנט';
      } else if (error.name === 'TypeError') {
        errorMessage = 'שגיאה טכנית - נסה שוב מאוחר יותר';
      } else {
        errorMessage = error.message || 'שגיאה לא צפויה';
      }
        
      setError(errorMessage);
      enqueueSnackbar(`שגיאה: ${errorMessage}`, { variant: 'error' });
      
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה להסתרת מספר כרטיס
  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return '';
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 4) return cardNumber;
    return '**** **** **** ' + cleaned.slice(-4);
  };
  
  // קביעת שם המתחם
  const getLocationName = () => {
    return booking?.location === 'airport' ? 'אור יהודה' : 'רוטשילד';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h6">
          סליקת כרטיס אשראי
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* פרטי הזמנה */}
        {booking && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              פרטי הזמנה
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Typography variant="body2">
                <strong>מספר הזמנה:</strong> {booking.bookingNumber}
              </Typography>
              <Typography variant="body2">
                <strong>מתחם:</strong> {getLocationName()}
              </Typography>
              <Typography variant="body2">
                <strong>שם אורח:</strong> {booking.firstName} {booking.lastName}
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* סכום לחיוב */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="סכום לחיוב"
            type="number"
            value={chargeAmount}
            onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">₪</InputAdornment>,
              inputProps: { min: 0, step: 0.01 }
            }}
            disabled={loading || result}
            sx={{ mb: 2 }}
          />
        </Box>
        
        {/* פרטי כרטיס אשראי */}
        {booking?.creditCard && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              פרטי כרטיס אשראי
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Typography variant="body2">
                <strong>מספר כרטיס:</strong> {maskCardNumber(booking.creditCard.cardNumber)}
              </Typography>
              <Typography variant="body2">
                <strong>תוקף:</strong> {booking.creditCard.expiryDate}
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* מצב טעינה */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              מבצע סליקה...
            </Typography>
          </Box>
        )}
        
        {/* הצגת שגיאה */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* הצגת תוצאה מוצלחת */}
        {result && result.success && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              הסליקה בוצעה בהצלחה!
            </Alert>
            
            <Box sx={{ p: 2, bgcolor: '#f0f8f0', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>מספר עסקה:</strong> {result.transactionId}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>סכום שנחרג:</strong> {result.amount} ₪
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>זמן עסקה:</strong> {new Date().toLocaleString('he-IL')}
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* הודעה אם אין פרטי אשראי */}
        {booking && (!booking.creditCard || !booking.creditCard.cardNumber) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            לא נמצאו פרטי כרטיס אשראי להזמנה זו.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {/* כפתורים למצב רגיל - עדיין לא בוצעה סליקה */}
        {!loading && !result && (
          <>
            <Button onClick={handleClose} color="inherit">
              ביטול
            </Button>
            <Button 
              onClick={handleCharge} 
              color="primary" 
              variant="contained"
              disabled={!booking?.creditCard?.cardNumber || !chargeAmount || chargeAmount <= 0}
            >
              בצע סליקה ({chargeAmount} ₪)
            </Button>
          </>
        )}
        
        {/* כפתורים למצב של תוצאה מוצלחת */}
        {result && result.success && (
          <Button onClick={handleClose} color="primary" variant="contained">
            סגור
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreditCardChargeDialog; 