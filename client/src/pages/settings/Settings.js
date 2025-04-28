import React from 'react';
import { Box, Typography, Paper, Button, Grid, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FlightIcon from '@mui/icons-material/Flight';

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
            <Box>
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
                ml: 2,
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
            <Box>
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
                ml: 2,
              }}
            >
              <ApartmentIcon fontSize="large" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Settings; 