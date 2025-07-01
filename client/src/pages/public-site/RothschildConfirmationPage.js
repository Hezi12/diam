import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
  Alert,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { 
  CheckCircleOutline as CheckCircleOutlineIcon,
  EventAvailable as EventAvailableIcon,
  BedroomParent as BedroomParentIcon,
  Share as ShareIcon,
  Home as HomeIcon,
  Print as PrintIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';
import { usePublicTranslation, usePublicLanguage } from '../../contexts/PublicLanguageContext';

const RothschildConfirmationPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const t = usePublicTranslation();
  const { currentLanguage } = usePublicLanguage();
  
  // בחירת locale לפי שפה נוכחית
  const dateLocale = currentLanguage === 'he' ? he : enUS;
  
  // נתוני ההזמנה מה-state שהועבר מהטופס הקודם
  const bookingData = location.state?.bookingData;
  
  useEffect(() => {
    // אם אין נתוני הזמנה, נווט לדף הבית
    if (!bookingData) {
      navigate('/rothschild-booking');
    }
  }, [bookingData, navigate]);
  
  // אם אין נתוני הזמנה, לא נציג כלום
  if (!bookingData) {
    return null;
  }
  
  // פורמט תאריכים
  const checkIn = parseISO(bookingData.checkIn);
  const checkOut = parseISO(bookingData.checkOut);
  const formattedCheckIn = checkIn ? format(checkIn, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  const formattedCheckOut = checkOut ? format(checkOut, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  
  // פורמט מספר הזמנה
  const formattedBookingNumber = bookingData.bookingNumber 
    ? bookingData.bookingNumber.toString().padStart(6, '0') 
    : '';
  
  // שיתוף ההזמנה
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
                title: t('confirmation.rothschildShareTitle'),
      text: t('confirmation.rothschildShareText', { 
            checkIn: formattedCheckIn, 
            checkOut: formattedCheckOut, 
            bookingNumber: formattedBookingNumber 
          }),
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };
  
  return (
    <PublicSiteLayout location="rothschild">
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
{t('confirmation.bookingConfirmed')}
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ mb: 3 }}
          >
{t('confirmation.bookingNumber')}: {formattedBookingNumber}
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
{t('confirmation.bookingDetails')}
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
{t('confirmation.stayDates')}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" align="right" paragraph sx={{ fontSize: '0.9rem' }}>
                    <strong>{t('search.checkIn')}:</strong> {formattedCheckIn}
                  </Typography>
                  <Typography variant="body2" align="right" sx={{ fontSize: '0.9rem' }}>
                    <strong>{t('search.checkOut')}:</strong> {formattedCheckOut}
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
{t('confirmation.roomDetails')}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" align="right" paragraph sx={{ fontSize: '0.9rem' }}>
                    <strong>{t('confirmation.roomType')}</strong> {bookingData.roomCategory}
                  </Typography>
                  <Typography variant="body2" align="right" sx={{ fontSize: '0.9rem' }}>
                    <strong>{t('confirmation.numberOfGuests')}</strong> {bookingData.guests}
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
{t('confirmation.totalAmount')}
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
            <Typography variant="body1" fontWeight={500}>
              {t('confirmation.rothschildSeeYouSoon')}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </PublicSiteLayout>
  );
};

export default RothschildConfirmationPage; 