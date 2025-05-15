import React from 'react';
import { Box, Paper, Typography, Link } from '@mui/material';
import { LocationOn as LocationOnIcon } from '@mui/icons-material';

// במצב אמיתי, כאן תהיה אינטגרציה עם Google Maps או ספק מפות אחר
// כרגע זו רק דוגמה ויזואלית

const LocationMap = () => {
  // פונקציה שתפתח את מיקום המלון ב-Google Maps
  const openInGoogleMaps = () => {
    // כתובת המלון - במצב אמיתי תהיה כאן כתובת אמיתית
    const address = 'אור יהודה, רחוב הערבה 5';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };
  
  // יצירת תמונת דמה במקום להשתמש בתמונה חיצונית
  const placeholderStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #e5e7eb 25%, #d1d5db 25%, #d1d5db 50%, #e5e7eb 50%, #e5e7eb 75%, #d1d5db 75%, #d1d5db 100%)',
    backgroundSize: '20px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#6b7280',
    position: 'relative'
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        height: '300px', 
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
      {/* תמונת דמה במקום תמונה חיצונית */}
      <Box sx={placeholderStyle}>
        <Typography variant="body2" sx={{ zIndex: 1, backgroundColor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1 }}>
          מפת מיקום (לחץ לפתיחה ב-Google Maps)
        </Typography>
      </Box>
      
      {/* סמן המיקום */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <LocationOnIcon 
          sx={{ 
            fontSize: 40, 
            color: 'error.main',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            mb: -1
          }} 
        />
        <Paper 
          elevation={3} 
          sx={{ 
            py: 0.5, 
            px: 2, 
            borderRadius: 5,
            minWidth: 140,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Airport Guest House
          </Typography>
        </Paper>
      </Box>
      
      {/* שכבת אינפורמציה בעת מעבר עכבר */}
      <Box 
        className="map-overlay"
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.6)',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'white', 
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.7)'
          }}
        >
          לחץ לפתיחה ב-Google Maps
        </Typography>
      </Box>
    </Paper>
  );
};

export default LocationMap; 