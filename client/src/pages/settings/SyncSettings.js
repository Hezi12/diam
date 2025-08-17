import React from 'react';
import { Box, Typography, Container, Paper, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ICalSettings from '../../components/settings/ICalSettings';

/**
 * דף הגדרות סנכרון
 * מכיל את כל הגדרות הסנכרון עם Booking.com
 */
const SyncSettings = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* כותרת עם כפתור חזרה */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Tooltip title="חזור להגדרות">
          <IconButton
            component={RouterLink}
            to="/settings"
            sx={{
              mr: 2,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          הגדרות סנכרון
        </Typography>
      </Box>

      {/* תיאור */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: 'rgba(0, 113, 227, 0.04)', border: '1px solid rgba(0, 113, 227, 0.1)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#0071e3', fontWeight: 'bold' }}>
          סנכרון עם Booking.com
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ניהול הגדרות הסנכרון האוטומטי עם פלטפורמות ההזמנות החיצוניות.
          כאן תוכל לקבוע קישורי iCal, לנהל מיפוי חדרים ולבקר את סטטוס הסנכרון.
        </Typography>
      </Paper>

      {/* הגדרות סנכרון iCal */}
      <ICalSettings />
    </Container>
  );
};

export default SyncSettings;
