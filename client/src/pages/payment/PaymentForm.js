import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  InputAdornment,
  FormControl,
  FormHelperText
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

/**
 * טופס להזנת פרטי כרטיס אשראי
 */
const PaymentForm = ({ 
  onBack, 
  onSubmit, 
  onChange, 
  creditCardData, 
  loading,
  language = 'he'
}) => {
  const isHebrew = language === 'he';
  
  // מצב שגיאות תיקוף
  const [errors, setErrors] = useState({});
  
  // טיפול בשינוי שדה
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const updatedData = {
      ...creditCardData,
      [name]: value
    };
    
    onChange(updatedData);
    
    // ניקוי שגיאה כשמשתמש מתקן
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // פורמט מספר כרטיס לקבוצות של 4 מספרים
  const formatCardNumber = (value) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };
  
  // פורמט תאריך תפוגה בפורמט MMYY
  const formatExpiryDate = (value) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 4);
  };
  
  // אימות הטופס לפני שליחה
  const validateForm = () => {
    const newErrors = {};
    
    // בדיקת מספר כרטיס
    if (!creditCardData.cardNumber) {
      newErrors.cardNumber = isHebrew ? 'יש להזין מספר כרטיס' : 'Card number is required';
    } else if (!/^\d{13,19}$/.test(creditCardData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = isHebrew ? 'מספר כרטיס לא תקין' : 'Invalid card number';
    }
    
    // בדיקת תאריך תפוגה
    if (!creditCardData.expiryDate) {
      newErrors.expiryDate = isHebrew ? 'יש להזין תאריך תפוגה' : 'Expiry date is required';
    } else if (!/^\d{4}$/.test(creditCardData.expiryDate)) {
      newErrors.expiryDate = isHebrew ? 'פורמט לא תקין (MMYY)' : 'Invalid format (MMYY)';
    } else {
      // בדיקת תוקף התאריך
      const month = creditCardData.expiryDate.substring(0, 2);
      const year = creditCardData.expiryDate.substring(2, 4);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (Number(month) < 1 || Number(month) > 12) {
        newErrors.expiryDate = isHebrew ? 'חודש לא תקין' : 'Invalid month';
      } else if (
        (Number(year) < currentYear) || 
        (Number(year) === currentYear && Number(month) < currentMonth)
      ) {
        newErrors.expiryDate = isHebrew ? 'כרטיס פג תוקף' : 'Card has expired';
      }
    }
    
    // בדיקת קוד אבטחה (CVV)
    if (!creditCardData.cvv) {
      newErrors.cvv = isHebrew ? 'יש להזין קוד אבטחה' : 'CVV is required';
    } else if (!/^\d{3,4}$/.test(creditCardData.cvv)) {
      newErrors.cvv = isHebrew ? 'קוד אבטחה לא תקין' : 'Invalid CVV';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // טיפול בשליחת הטופס
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit();
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" align="center" gutterBottom sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
        {isHebrew ? 'הזנת פרטי אשראי' : 'Enter Credit Card Details'}
      </Typography>
      
      <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
        {isHebrew 
          ? 'פרטי האשראי שלך מאובטחים ומוצפנים. לא תתבצע גבייה בשלב זה.'
          : 'Your credit card details are secure and encrypted. No charge will be made at this stage.'}
      </Alert>
      
      <Grid container spacing={2}>
        {/* מספר כרטיס */}
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label={isHebrew ? 'מספר כרטיס' : 'Card Number'}
            name="cardNumber"
            value={creditCardData.cardNumber}
            onChange={(e) => {
              const formatted = formatCardNumber(e.target.value);
              handleChange({ target: { name: 'cardNumber', value: formatted } });
            }}
            error={Boolean(errors.cardNumber)}
            helperText={errors.cardNumber}
            placeholder="0000 0000 0000 0000"
            inputProps={{ 
              maxLength: 19,
              inputMode: 'numeric'
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CreditCardIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              direction: 'ltr',
              '& .MuiInputBase-input': { 
                fontSize: { xs: '0.95rem', sm: '1rem' }, 
                padding: { xs: '12px 14px' }
              }
            }}
          />
        </Grid>
        
        {/* שורה של תאריך תפוגה ו-CVV */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label={isHebrew ? 'תוקף' : 'Expiry Date'}
            name="expiryDate"
            value={creditCardData.expiryDate}
            onChange={(e) => {
              const formatted = formatExpiryDate(e.target.value);
              handleChange({ target: { name: 'expiryDate', value: formatted } });
            }}
            error={Boolean(errors.expiryDate)}
            helperText={errors.expiryDate || (isHebrew ? 'פורמט: חודש+שנה (MMYY)' : 'Format: Month+Year (MMYY)')}
            placeholder="MMYY"
            inputProps={{ 
              maxLength: 4,
              inputMode: 'numeric'
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              direction: 'ltr',
              '& .MuiInputBase-input': { 
                fontSize: { xs: '0.95rem', sm: '1rem' }, 
                padding: { xs: '12px 14px' }
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label={isHebrew ? 'קוד אבטחה' : 'CVV'}
            name="cvv"
            value={creditCardData.cvv}
            onChange={(e) => {
              handleChange({ 
                target: { 
                  name: 'cvv', 
                  value: e.target.value.replace(/\D/g, '').slice(0, 4)
                } 
              });
            }}
            error={Boolean(errors.cvv)}
            helperText={errors.cvv}
            type="password"
            inputProps={{ 
              maxLength: 4,
              inputMode: 'numeric'
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              direction: 'ltr',
              '& .MuiInputBase-input': { 
                fontSize: { xs: '0.95rem', sm: '1rem' }, 
                padding: { xs: '12px 14px' }
              }
            }}
          />
        </Grid>
      </Grid>
      
      {/* כפתורי פעולה */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: { xs: 3, sm: 4 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <Button 
          onClick={onBack}
          disabled={loading}
          sx={{ 
            order: { xs: 2, sm: 1 }, 
            mt: { xs: 2, sm: 0 }, 
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {isHebrew ? 'חזרה' : 'Back'}
        </Button>
        
        <Button 
          type="submit"
          variant="contained" 
          color="primary"
          disabled={loading}
          sx={{ 
            minWidth: 120, 
            order: { xs: 1, sm: 2 }, 
            width: { xs: '100%', sm: 'auto' },
            py: { xs: 1.2, sm: 1 }
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            isHebrew ? 'שמירה' : 'Submit'
          )}
        </Button>
      </Box>
      
      {/* הערת אבטחה */}
      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center"
        sx={{ mt: { xs: 4, sm: 3 }, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
      >
        <LockIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
        {isHebrew 
          ? 'המידע מועבר באופן מאובטח ומוצפן (SSL)'
          : 'Your information is sent securely and encrypted (SSL)'}
      </Typography>
    </Box>
  );
};

export default PaymentForm; 