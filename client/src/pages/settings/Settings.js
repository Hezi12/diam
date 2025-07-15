import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Grid, Container, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FlightIcon from '@mui/icons-material/Flight';
import SyncIcon from '@mui/icons-material/Sync';
import EmailIcon from '@mui/icons-material/Email';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ICalSettings from '../../components/settings/ICalSettings';
import { useSnackbar } from 'notistack';

/**
 * עמוד הגדרות מרכזי
 * מכיל קישורים לדפי הגדרות שונים במערכת
 */
const Settings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [refreshing, setRefreshing] = useState(false);

  // פונקציה לרענון רשימת האורחים
  const refreshGuestList = async () => {
    setRefreshing(true);
    try {
      // שליחת אירוע לכל החלונות הפתוחים
      if (typeof window !== 'undefined') {
        // שליחת אירוע לכל החלונות הפתוחים
        window.postMessage('refresh-guests', window.location.origin);
        
        // חיפוש וספירת חלונות לוח המודעות הפתוחים
        localStorage.setItem('refresh-guests-trigger', Date.now().toString());
      }
      
      // הצגת הודעת הצלחה
      enqueueSnackbar('בקשת רענון נשלחה', { variant: 'success' });
    } catch (error) {
      console.error('שגיאה ברענון רשימת האורחים:', error);
      enqueueSnackbar('שגיאה ברענון רשימת האורחים', { variant: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  // פונקציה לפתיחת הדף הציבורי
  const openPublicNoticeBoard = () => {
    window.open('/notice-board-public', 'noticeBoardPublic', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');
  };
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        הגדרות המערכת
      </Typography>

      <Grid container spacing={3}>
        {/* ניהול חדרים - שדה התעופה */}
        <Grid item xs={12} sm={6}>
          <Paper
            component={RouterLink}
            to="/settings/rooms/airport"
            sx={{
              p: 3,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                bgcolor: 'rgba(0, 113, 227, 0.04)'
              }
            }}
          >
            <Box sx={{ maxWidth: '70%' }}>
              <Typography variant="h6" color="inherit" gutterBottom sx={{ fontWeight: 'bold' }}>
                ניהול חדרים - אור יהודה
              </Typography>
              <Typography variant="body2" color="text.secondary">
                הוספה, עריכה ומחיקת חדרים במתחם אור יהודה
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: 'rgba(0, 113, 227, 0.1)',
                color: '#0071e3',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
              }}
            >
              <FlightIcon fontSize="large" />
            </Box>
          </Paper>
        </Grid>

        {/* ניהול חדרים - רוטשילד */}
        <Grid item xs={12} sm={6}>
          <Paper
            component={RouterLink}
            to="/settings/rooms/rothschild"
            sx={{
              p: 3,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                bgcolor: 'rgba(227, 74, 111, 0.04)'
              }
            }}
          >
            <Box sx={{ maxWidth: '70%' }}>
              <Typography variant="h6" color="inherit" gutterBottom sx={{ fontWeight: 'bold' }}>
                ניהול חדרים - רוטשילד
              </Typography>
              <Typography variant="body2" color="text.secondary">
                הוספה, עריכה ומחיקת חדרים במתחם רוטשילד
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: 'rgba(227, 74, 111, 0.1)',
                color: '#e34a6f',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
              }}
            >
              <ApartmentIcon fontSize="large" />
            </Box>
          </Paper>
        </Grid>

        {/* ניהול הנחות */}
        <Grid item xs={12} sm={6}>
          <Paper
            component={RouterLink}
            to="/settings/discounts"
            sx={{
              p: 3,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                bgcolor: 'rgba(255, 152, 0, 0.04)'
              }
            }}
          >
            <Box sx={{ maxWidth: '70%' }}>
              <Typography variant="h6" color="inherit" gutterBottom sx={{ fontWeight: 'bold' }}>
                ניהול הנחות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                יצירה ועריכה של הנחות לאתרי ההזמנות
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: 'rgba(255, 152, 0, 0.1)',
                color: '#ff9800',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
              }}
            >
              <LocalOfferIcon fontSize="large" />
            </Box>
          </Paper>
        </Grid>

        {/* תצוגה מקדימה - מיילים */}
        <Grid item xs={12} sm={6}>
          <Paper
            component={RouterLink}
            to="/email-preview"
            sx={{
              p: 3,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                bgcolor: 'rgba(33, 150, 243, 0.04)'
              }
            }}
          >
            <Box sx={{ maxWidth: '70%' }}>
              <Typography variant="h6" color="inherit" gutterBottom sx={{ fontWeight: 'bold' }}>
                תצוגה מקדימה - מיילים
              </Typography>
              <Typography variant="body2" color="text.secondary">
                צפייה ובדיקת תבניות המיילים של המערכת
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: 'rgba(33, 150, 243, 0.1)',
                color: '#2196f3',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
              }}
            >
              <EmailIcon fontSize="large" />
            </Box>
          </Paper>
        </Grid>



        {/* לוח מודעות - איירפורט */}
        <Grid item xs={12} sm={6}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                bgcolor: 'rgba(33, 150, 243, 0.04)'
              }
            }}
          >
            <Box sx={{ maxWidth: '60%' }}>
              <Typography variant="h6" color="inherit" gutterBottom sx={{ fontWeight: 'bold' }}>
                לוח מודעות - איירפורט
              </Typography>
              <Typography variant="body2" color="text.secondary">
                לוח מודעות ציבורי עם אורחים ומידע שימושי
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="רענון רשימת אורחים">
                <IconButton
                  onClick={refreshGuestList}
                  disabled={refreshing}
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: '#2196f3',
                    '&:hover': {
                      bgcolor: 'rgba(33, 150, 243, 0.2)'
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="פתח לוח מודעות ציבורי">
                <IconButton
                  onClick={openPublicNoticeBoard}
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: '#2196f3',
                    '&:hover': {
                      bgcolor: 'rgba(33, 150, 243, 0.2)'
                    }
                  }}
                >
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* הגדרות סנכרון iCal עם Booking.com */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          סנכרון עם Booking.com
        </Typography>
        <ICalSettings />
      </Box>
    </Container>
  );
};

export default Settings; 