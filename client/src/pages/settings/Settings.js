import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Grid, Container, IconButton, Tooltip, Switch, FormControlLabel } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FlightIcon from '@mui/icons-material/Flight';
import SyncIcon from '@mui/icons-material/Sync';
import EmailIcon from '@mui/icons-material/Email';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ICalSettings from '../../components/settings/ICalSettings';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { API_URL } from '../../config/apiConfig';

/**
 * עמוד הגדרות מרכזי
 * מכיל קישורים לדפי הגדרות שונים במערכת
 */
const Settings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [refreshing, setRefreshing] = useState(false);
  const [hideGuestNames, setHideGuestNames] = useState(false);
  const [loadingGuestNames, setLoadingGuestNames] = useState(false);

  // פונקציה לרענון רשימת האורחים
  const refreshGuestList = async () => {
    setRefreshing(true);
    try {
      // שליחת בקשת רענון לשרת
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/bookings/notice-board/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        enqueueSnackbar('בקשת רענון נשלחה בהצלחה', { variant: 'success' });
      } else {
        throw new Error('שגיאה בשליחת בקשת הרענון');
      }
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

  // טעינת הגדרות לוח המודעות
  const loadNoticeBoardSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/public-site/notice-board/settings`);
      if (response.data.success) {
        setHideGuestNames(response.data.settings.hideRealGuestNames);
      }
    } catch (error) {
      console.error('שגיאה בטעינת הגדרות לוח המודעות:', error);
    }
  };

  // הפעלה/השבתה של הסתרת שמות אורחים
  const toggleGuestNamesVisibility = async () => {
    setLoadingGuestNames(true);
    try {
      const response = await axios.patch(`${API_URL}/api/public-site/notice-board/toggle-guest-names`);
      if (response.data.success) {
        setHideGuestNames(response.data.hideRealGuestNames);
        enqueueSnackbar(response.data.message, { variant: 'success' });
      }
    } catch (error) {
      console.error('שגיאה בעדכון הגדרת שמות אורחים:', error);
      enqueueSnackbar('שגיאה בעדכון הגדרת שמות אורחים', { variant: 'error' });
    } finally {
      setLoadingGuestNames(false);
    }
  };

  // טעינת הגדרות בטעינת הקומפוננט
  useEffect(() => {
    loadNoticeBoardSettings();
  }, []);
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
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(33, 150, 243, 0.2)',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'rgba(33, 150, 243, 0.4)',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.1)'
              }
            }}
          >
            {/* כותרת ופעולות */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                  לוח מודעות ציבורי
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  רענון רשימת אורחים, הגדרות תצוגה ופתיחת לוח מודעות ציבורי
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
            </Box>
            
            {/* הגדרת הסתרת שמות אורחים */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              bgcolor: 'rgba(33, 150, 243, 0.05)',
              p: 2,
              borderRadius: 1,
              border: '1px solid rgba(33, 150, 243, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {hideGuestNames ? <VisibilityOffIcon color="warning" /> : <VisibilityIcon color="success" />}
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {hideGuestNames ? 'שמות אורחים מוסתרים' : 'שמות אורחים מוצגים'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hideGuestNames 
                      ? 'בלוח המודעות יוצגו רק שמות ברירת מחדל'
                      : 'בלוח המודעות יוצגו שמות אורחים אמיתיים'
                    }
                  </Typography>
                </Box>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={hideGuestNames}
                    onChange={toggleGuestNamesVisibility}
                    disabled={loadingGuestNames}
                    color="primary"
                  />
                }
                label={hideGuestNames ? 'הסתר שמות' : 'הצג שמות'}
                labelPlacement="start"
                sx={{ m: 0 }}
              />
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