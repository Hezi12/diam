import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { LocalOffer as OfferIcon } from '@mui/icons-material';
import publicSiteService from '../../services/publicSiteService';
import { usePublicTranslation, usePublicLanguage } from '../../contexts/PublicLanguageContext';

/**
 * באנר הנחת הזמנה ישירה
 * מופיע מתחת לטופס החיפוש בדף הבית
 */
const DirectBookingBanner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const t = usePublicTranslation();
  const { currentLanguage } = usePublicLanguage();
  
  const [bannerSettings, setBannerSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // טעינת הגדרות הבאנר מהשרת
  useEffect(() => {
    const fetchBannerSettings = async () => {
      try {
        const response = await publicSiteService.getDirectBookingBannerSettings();
        setBannerSettings(response);
      } catch (error) {
        console.error('שגיאה בטעינת הגדרות באנר ההזמנה הישירה:', error);
        // במקרה של שגיאה, נציג באנר ברירת מחדל
        setBannerSettings({
          enabled: true,
          discountPercentage: 15,
          content: {
            he: { text: '15% הנחה בהזמנה ישירה' },
            en: { text: '15% OFF for Direct Booking' }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBannerSettings();
    
    // רענון תקופתי כל 30 שניות לבדיקת שינויים
    const interval = setInterval(fetchBannerSettings, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // אם עדיין טוען או הבאנר לא פעיל, לא נציג כלום
  if (loading || !bannerSettings?.enabled) return null;

  const bannerText = bannerSettings.content?.[currentLanguage]?.text || 
                     (currentLanguage === 'he' ? `${bannerSettings.discountPercentage}% הנחה בהזמנה ישירה` : 
                      `${bannerSettings.discountPercentage}% OFF for Direct Booking`);

  return (
    <Box
      sx={{
        width: '100%',
        mt: 2,
        mb: 2
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: { xs: 1, sm: 1.25, md: 1.5 },
          background: 'linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%)',
          borderRadius: 2,
          border: '1px solid rgba(209, 213, 219, 0.5)',
          boxShadow: '0 2px 12px rgba(229, 231, 235, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.4)), linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.4))',
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px',
            opacity: 0.5
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            position: 'relative',
            zIndex: 1,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            py: 0.5
          }}
        >
          <OfferIcon
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              color: '#374151',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              color: '#374151',
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            {bannerText}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DirectBookingBanner;

