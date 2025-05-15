import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button,
  Grid,
  Divider,
  useTheme
} from '@mui/material';
import { 
  CheckCircleOutline as CheckCircleOutlineIcon,
  EventAvailable as EventAvailableIcon,
  BedroomParent as BedroomParentIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

const ConfirmationPage = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  // נתונים מה-state
  const bookingData = location.state || {};
  
  // אם אין נתונים, נחזיר לדף הבית
  useEffect(() => {
    if (!bookingData.bookingNumber) {
      navigate('/airport-booking');
    }
  }, [bookingData, navigate]);
  
  // המרת תאריכים
  const checkIn = bookingData.checkIn ? parseISO(bookingData.checkIn) : null;
  const checkOut = bookingData.checkOut ? parseISO(bookingData.checkOut) : null;
  
  // פורמט תאריכים לתצוגה
  const formattedCheckIn = checkIn ? format(checkIn, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  const formattedCheckOut = checkOut ? format(checkOut, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  
  // פורמט מספר הזמנה
  const formattedBookingNumber = bookingData.bookingNumber 
    ? bookingData.bookingNumber.toString().padStart(6, '0') 
    : '';
  
  // שיתוף ההזמנה
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'הזמנה במלונית Airport Guest House',
          text: `הזמנתי חדר במלונית Airport Guest House לתאריכים ${formattedCheckIn} עד ${formattedCheckOut}. מספר הזמנה: ${formattedBookingNumber}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };
  
  // אם אין נתונים, לא נציג דבר
  if (!bookingData.bookingNumber) {
    return null;
  }
  
  return (
    <PublicSiteLayout>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: '10px'
          }}
        >
          <CheckCircleOutlineIcon 
            sx={{ 
              fontSize: 70, 
              color: 'success.main', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            ההזמנה התקבלה בהצלחה!
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            מספר הזמנה: {formattedBookingNumber}
          </Typography>
          
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{ mx: 1 }}
            >
              שתף הזמנה
            </Button>
            <Button
              variant="contained"
              component={Link}
              to="/airport-booking"
              sx={{ mx: 1 }}
            >
              חזרה לדף הבית
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom align="right">
              פרטי ההזמנה
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    borderRadius: '10px',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventAvailableIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body1" fontWeight={600}>
                      תאריכי שהייה
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" align="right" paragraph>
                    <strong>צ'ק-אין:</strong> {formattedCheckIn}
                  </Typography>
                  <Typography variant="body2" align="right">
                    <strong>צ'ק-אאוט:</strong> {formattedCheckOut}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    borderRadius: '10px',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BedroomParentIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body1" fontWeight={600}>
                      פרטי החדר
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" align="right" paragraph>
                    <strong>סוג חדר:</strong> {bookingData.roomCategory}
                  </Typography>
                  <Typography variant="body2" align="right">
                    <strong>מספר חדר:</strong> {bookingData.roomNumber}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mt: 3, 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                borderRadius: '10px'
              }}
            >
              <Grid container>
                <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" fontWeight={600}>
                    סכום לתשלום במלונית:
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" fontWeight={700}>
                    {bookingData.totalPrice} ₪
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mt: 3, mb: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              אישור הזמנה זה נשלח לכתובת המייל שלך.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              נתראה ב-Airport Guest House!
            </Typography>
          </Box>
        </Paper>
      </Container>
    </PublicSiteLayout>
  );
};

export default ConfirmationPage; 