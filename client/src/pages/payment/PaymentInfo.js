import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  CreditCard as CreditCardIcon,
  Person as PersonIcon,
  Hotel as HotelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * רכיב המציג את פרטי ההזמנה למשלם
 */
const PaymentInfo = ({ paymentData, onNext }) => {
  const isHebrew = paymentData.language === 'he';
  
  // פונקציה לפורמט תאריך בשפה הנבחרת
  const formatDate = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'EEEE, dd MMMM yyyy', {
      locale: isHebrew ? he : undefined
    });
  };
  
  return (
    <Box>
      {/* כותרת */}
      <Typography variant="h5" align="center" gutterBottom sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
        {isHebrew ? 'פרטי ההזמנה שלך' : 'Your Booking Details'}
      </Typography>
      
      {/* מידע לגבי הצעד הבא */}
      <Alert severity="info" sx={{ my: 2 }}>
        {isHebrew 
          ? 'אנא ודא שפרטי ההזמנה נכונים ולחץ על "המשך" כדי למלא את פרטי האשראי שלך.'
          : 'Please verify your booking details and click "Continue" to fill in your credit card information.'}
      </Alert>
      
      {/* פרטי האורח */}
      <Paper elevation={0} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <PersonIcon color="primary" />
          </Grid>
          <Grid item xs>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              {isHebrew ? 'שם אורח' : 'Guest Name'}
            </Typography>
            <Typography variant="body1">
              {paymentData.guestName}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* פרטי התאריכים */}
      <Paper elevation={0} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <CalendarIcon color="primary" />
          </Grid>
          <Grid item xs={12} sm>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              {isHebrew ? 'תאריכי שהייה' : 'Stay Dates'}
            </Typography>
            
            <Grid container spacing={1} sx={{ mt: { xs: 0.5, sm: 1 } }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  {isHebrew ? 'כניסה' : 'Check-in'}:
                </Typography>
                <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {formatDate(paymentData.checkIn)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  {isHebrew ? 'יציאה' : 'Check-out'}:
                </Typography>
                <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {formatDate(paymentData.checkOut)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      
      {/* פרטי תשלום */}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: '#f8f9fa'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <CreditCardIcon color="primary" />
          </Grid>
          <Grid item xs>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
              {isHebrew ? 'סכום לתשלום' : 'Payment Amount'}
            </Typography>
            
            <Typography variant="h4" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              ₪{paymentData.amount.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* כפתור המשך */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={onNext}
          sx={{ px: { xs: 3, sm: 4 }, py: { xs: 1.2, sm: 1 }, fontSize: { xs: '1rem', sm: '1rem' } }}
          fullWidth={window.innerWidth < 400}
        >
          {isHebrew ? 'המשך לפרטי תשלום' : 'Continue to Payment'}
        </Button>
      </Box>
      
      {/* הערה לגבי אבטחה */}
      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center"
        sx={{ mt: 3 }}
      >
        {isHebrew 
          ? 'פרטי התשלום שלך מאובטחים ומוצפנים.' 
          : 'Your payment information is secure and encrypted.'}
      </Typography>
    </Box>
  );
};

export default PaymentInfo; 