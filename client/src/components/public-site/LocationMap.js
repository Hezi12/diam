import React from 'react';
import { Box, Paper, Typography, Link } from '@mui/material';
import { LocationOn as LocationOnIcon } from '@mui/icons-material';
import { usePublicTranslation, usePublicLanguage } from '../../contexts/PublicLanguageContext';

// במצב אמיתי, כאן תהיה אינטגרציה עם Google Maps או ספק מפות אחר
// כרגע זו רק דוגמה ויזואלית

const LocationMap = ({ location: siteLocation = 'airport' }) => {
  const t = usePublicTranslation();
  const { currentLanguage } = usePublicLanguage();
  
  // פונקציה שתפתח את מיקום המלון ב-Google Maps
  const openInGoogleMaps = () => {
    // כתובת המלון - במצב אמיתי תהיה כאן כתובת אמיתית
    const addressKey = siteLocation === 'rothschild' ? 'location.rothschildAddress' : 'location.address';
    const address = t(addressKey);
    const country = currentLanguage === 'he' ? 'ישראל' : 'Israel';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ', ' + country)}`, '_blank');
  };
  
  // יצירת iframe למפת גוגל עם כתובת פשוטה
  const addressKey = siteLocation === 'rothschild' ? 'location.rothschildAddress' : 'location.address';
  const country = currentLanguage === 'he' ? 'ישראל' : 'Israel';
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(t(addressKey) + ', ' + country)}&t=&z=15&ie=UTF8&iwloc=&output=embed&hl=${currentLanguage}`;
  
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
        title={t('location.mapTitle')}
      />
      

    </Paper>
  );
};

export default LocationMap; 