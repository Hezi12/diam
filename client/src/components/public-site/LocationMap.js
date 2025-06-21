import React from 'react';
import { Box, Paper, Typography, Link } from '@mui/material';
import { LocationOn as LocationOnIcon } from '@mui/icons-material';

// במצב אמיתי, כאן תהיה אינטגרציה עם Google Maps או ספק מפות אחר
// כרגע זו רק דוגמה ויזואלית

const LocationMap = () => {
  // פונקציה שתפתח את מיקום המלון ב-Google Maps
  const openInGoogleMaps = () => {
    // כתובת המלון - במצב אמיתי תהיה כאן כתובת אמיתית
    const address = 'הארז 12, אור יהודה';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };
  
  // יצירת iframe למפת גוגל עם כתובת פשוטה
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent('הארז 12, אור יהודה, ישראל')}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
        bgcolor: '#f5f7fa',
        border: '1px solid #eee',
        cursor: 'pointer',
        '&:hover .map-overlay': {
          opacity: 1
        }
      }}
      onClick={openInGoogleMaps}
    >
      {/* מפת גוגל מוטמעת */}
      <iframe
        src={mapEmbedUrl}
        width="100%"
        height="100%"
        style={{ 
          border: 0,
          borderRadius: '8px'
        }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="מיקום המלונית - הארז 12, אור יהודה"
      />
      

    </Paper>
  );
};

export default LocationMap; 