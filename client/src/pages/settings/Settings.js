import React from 'react';
import { Box, Typography, Paper, Button, Grid, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FlightIcon from '@mui/icons-material/Flight';
import SyncIcon from '@mui/icons-material/Sync';
import EmailIcon from '@mui/icons-material/Email';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import ICalSettings from '../../components/settings/ICalSettings';

/**
 * עמוד הגדרות מרכזי
 * מכיל קישורים לדפי הגדרות שונים במערכת
 */
const Settings = () => {
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

        {/* הגדרות לוח מודעות */}
        <Grid item xs={12} sm={6}>
          <Paper
            component={RouterLink}
            to="/settings/notice-board"
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
                הגדרות לוח מודעות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                עריכת מידע WiFi, מונית וצ'ק אין/אאוט
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
              <CampaignIcon fontSize="large" />
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