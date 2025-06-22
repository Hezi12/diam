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
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  CheckCircleOutline as CheckCircleOutlineIcon,
  EventAvailable as EventAvailableIcon,
  BedroomParent as BedroomParentIcon,
  Share as ShareIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

const ConfirmationPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            textAlign: 'center',
            borderRadius: '10px'
          }}
        >
          <CheckCircleOutlineIcon 
            sx={{ 
              fontSize: 60, 
              color: 'success.main', 
              mb: 2 
            }} 
          />
          
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight={600} 
            gutterBottom
            sx={{ mb: 1 }}
          >
            ההזמנה התקבלה בהצלחה!
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ mb: 3 }}
          >
            מספר הזמנה: {formattedBookingNumber}
          </Typography>
          

          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mt: 3 }}>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              gutterBottom 
              align="right"
              sx={{ mb: 2 }}
            >
              פרטי ההזמנה
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#f8fafc', 
                    borderRadius: '8px',
                    height: '100%',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <EventAvailableIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body1" fontWeight={600}>
                      תאריכי שהייה
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" align="right" paragraph sx={{ fontSize: '0.9rem' }}>
                    <strong>צ'ק-אין:</strong> {formattedCheckIn}
                  </Typography>
                  <Typography variant="body2" align="right" sx={{ fontSize: '0.9rem' }}>
                    <strong>צ'ק-אאוט:</strong> {formattedCheckOut}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#f8fafc', 
                    borderRadius: '8px',
                    height: '100%',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <BedroomParentIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                    <Typography variant="body1" fontWeight={600}>
                      פרטי החדר
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" align="right" paragraph sx={{ fontSize: '0.9rem' }}>
                    <strong>סוג חדר:</strong> {bookingData.roomCategory}
                  </Typography>
                  <Typography variant="body2" align="right" sx={{ fontSize: '0.9rem' }}>
                    <strong>מספר אורחים:</strong> {bookingData.guests}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#f0f9ff', 
                    borderRadius: '8px',
                    height: '100%',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      סכום לתשלום
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" align="right" fontWeight={700} color="primary.main" sx={{ mt: 1 }}>
                    {bookingData.totalPrice} ₪
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mt: 3, mb: 1, textAlign: 'center' }}>
            <Typography variant="body1" color="text.primary" paragraph sx={{ fontWeight: 500 }}>
              📧 אישור הזמנה נשלח לכתובת המייל שלך
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              נתראה ב-Airport Guest House!
            </Typography>
          </Box>
        </Paper>
      </Container>
    </PublicSiteLayout>
  );
};

export default ConfirmationPage; 