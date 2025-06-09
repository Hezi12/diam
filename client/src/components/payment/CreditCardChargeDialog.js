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
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Paper
} from '@mui/material';
import { useSnackbar } from 'notistack';
import icountService from '../../services/icountService';

const CreditCardChargeDialog = ({ open, onClose, booking }) => {
  // מצב סכום לחיוב
  const [chargeAmount, setChargeAmount] = useState(booking?.price || 0);
  
  // מצב טעינה ותוצאות
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // מצב חדש - האם להוציא חשבונית
  const [createInvoice, setCreateInvoice] = useState(true);
  
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
      resetDialog();
      onClose();
    }
  };
  
  // פונקציה לאיפוס הדיאלוג
  const resetDialog = () => {
    setChargeAmount(booking?.price || 0);
    setCreateInvoice(true);
    setLoading(false);
    setResult(null);
    setError(null);
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
      const response = await icountService.chargeCard(booking.location, booking._id, chargeAmount, createInvoice);
      
      console.log('✅ תגובה מהשרת:', response);
      
      if (response.success) {
        console.log(`🎉 סליקה הושלמה בהצלחה! מספר עסקה: ${response.transactionId}`);
        
        // הצגת הודעת הצלחה
        const successMessage = createInvoice 
          ? `✅ הסליקה בוצעה בהצלחה! ${response.invoice ? `חשבונית: ${response.invoice.docNum}` : ''}` 
          : '✅ הסליקה בוצעה בהצלחה ללא חשבונית!';
        
        enqueueSnackbar(successMessage, { 
          variant: 'success',
          autoHideDuration: 6000
        });
        
        setResult({
          success: true,
          transactionId: response.transactionId,
          amount: response.amount,
          cardType: response.cardType,
          invoice: response.invoice,
          hasInvoice: createInvoice,
          message: successMessage
        });
        
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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1, 
        pt: 3,
        px: 3
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          letterSpacing: '-0.025em'
        }}>
          סליקת כרטיס אשראי
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* פריסה חדשה - שני עמודים */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3
        }}>
          {/* עמודה שמאלית - פרטי הזמנה */}
          {booking && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 1.5
              }}>
                פרטי הזמנה
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>מספר הזמנה:</span>
                  <span style={{ fontWeight: 600, color: '#1976d2' }}>{booking.bookingNumber}</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>מתחם:</span>
                  <span>{getLocationName()}</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>שם אורח:</span>
                  <span>{booking.firstName} {booking.lastName}</span>
                </Typography>
              </Box>
            </Box>
          )}

          {/* עמודה ימנית - סכום לחיוב */}
          <Box sx={{ mt: 2 }}>
            <TextField
              label="סכום לחיוב"
              type="number"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
              fullWidth
              variant="outlined"
              InputProps={{
                endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
                sx: {
                  fontSize: '1.1rem',
                  fontWeight: 500
                }
              }}
              InputLabelProps={{
                sx: { fontWeight: 500 }
              }}
              disabled={loading || result}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  }
                }
              }}
            />
          </Box>
        </Box>
        
        {/* מצב טעינה */}
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 4,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body1" sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}>
              מבצע סליקה...
            </Typography>
          </Box>
        )}
        
        {/* הצגת שגיאה */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontWeight: 500
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        {/* תוצאת הסליקה */}
        {result && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3, 
              backgroundColor: result.success ? 'success.light' : 'error.light',
              color: result.success ? 'success.contrastText' : 'error.contrastText',
              borderRadius: 2,
              border: '2px solid',
              borderColor: result.success ? 'success.main' : 'error.main'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {result.success ? '✅ סליקה הושלמה בהצלחה!' : '❌ סליקה נכשלה'}
            </Typography>
            
            {result.success && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  מספר עסקה: <strong>{result.transactionId}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  סכום שנוע: <strong>{result.amount} ₪</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  סוג כרטיס: <strong>{result.cardType}</strong>
                </Typography>
                
                {/* מידע על חשבונית */}
                {result.hasInvoice && (
                  <>
                    {result.invoice && result.invoice.success ? (
                      <Typography variant="body2" sx={{ 
                        mt: 2, 
                        p: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 1,
                        fontWeight: 600
                      }}>
                        📄 חשבונית נוצרה: {result.invoice.docNum}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ 
                        mt: 2, 
                        p: 1.5,
                        bgcolor: 'rgba(255, 193, 7, 0.2)',
                        borderRadius: 1,
                        color: 'warning.dark',
                        fontWeight: 500
                      }}>
                        ⚠️ חשבונית לא נוצרה (סליקה בוצעה בהצלחה)
                      </Typography>
                    )}
                  </>
                )}
                
                {/* הודעה אם לא נבחר ליצור חשבונית */}
                {!result.hasInvoice && (
                  <Typography variant="body2" sx={{ 
                    mt: 2, 
                    p: 1.5,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 1,
                    fontStyle: 'italic',
                    fontWeight: 500
                  }}>
                    💡 נבחר לא ליצור חשבונית
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}
        
        {/* הודעה אם אין פרטי אשראי */}
        {booking && (!booking.creditCard || !booking.creditCard.cardNumber) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            לא נמצאו פרטי כרטיס אשראי להזמנה זו.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2
      }}>
        {/* חקבוקס להוצאת חשבונית - מינימלי */}
        <FormControlLabel
          control={
            <Checkbox
              checked={createInvoice}
              onChange={(e) => setCreateInvoice(e.target.checked)}
              disabled={loading || result}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
              הוצא חשבונית
            </Typography>
          }
          sx={{ m: 0 }}
        />
        
        {/* כפתורים */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            variant="outlined"
            sx={{ 
              minWidth: 80,
              borderRadius: 2,
              fontWeight: 500
            }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleCharge} 
            disabled={loading || result || !chargeAmount || chargeAmount <= 0}
            variant="contained"
            size="large"
            sx={{ 
              minWidth: 120,
              borderRadius: 2,
              fontWeight: 600,
              px: 3
            }}
          >
            {loading ? 'מבצע סליקה...' : `בצע סליקה (${chargeAmount} ₪)`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CreditCardChargeDialog; 