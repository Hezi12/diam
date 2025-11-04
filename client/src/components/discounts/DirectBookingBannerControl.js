import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import publicSiteService from '../../services/publicSiteService';

/**
 * קומפוננט לניהול באנר ההזמנה הישירה
 * מאפשר הפעלה/השבתה ועריכת אחוז ההנחה
 */
const DirectBookingBannerControl = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const [editContent, setEditContent] = useState({ he: { text: '' }, en: { text: '' } });

  // טעינת הגדרות הבאנר
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await publicSiteService.getPublicSiteSettings();
      const bannerSettings = response.directBookingBanner || {
        enabled: true,
        discountPercentage: 15,
        content: {
          he: { text: '15% הנחה בהזמנה ישירה' },
          en: { text: '15% OFF for Direct Booking' }
        }
      };
      
      setSettings(response);
      setDiscountPercentage(bannerSettings.discountPercentage || 15);
      setEditContent(bannerSettings.content || {
        he: { text: '15% הנחה בהזמנה ישירה' },
        en: { text: '15% OFF for Direct Booking' }
      });
      
    } catch (error) {
      console.error('שגיאה בטעינת הגדרות הבאנר:', error);
      setError('שגיאה בטעינת הגדרות הבאנר');
    } finally {
      setLoading(false);
    }
  };

  // הפעלה/השבתה של הבאנר
  const toggleBanner = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await publicSiteService.toggleDirectBookingBanner();
      
      setSettings(prev => ({
        ...prev,
        directBookingBanner: {
          ...prev.directBookingBanner,
          enabled: response.enabled
        }
      }));
      
      setSuccess(`הבאנר ${response.enabled ? 'הופעל' : 'הושבת'} בהצלחה`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('שגיאה בשינוי מצב הבאנר:', error);
      setError('שגיאה בשינוי מצב הבאנר');
    } finally {
      setSaving(false);
    }
  };

  // שמירת אחוז ההנחה
  const saveDiscountPercentage = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (discountPercentage < 0 || discountPercentage > 100) {
        setError('אחוז ההנחה חייב להיות בין 0 ל-100');
        return;
      }
      
      await publicSiteService.updateDirectBookingBanner({
        discountPercentage: discountPercentage
      });
      
      setSettings(prev => ({
        ...prev,
        directBookingBanner: {
          ...prev.directBookingBanner,
          discountPercentage: discountPercentage
        }
      }));
      
      setSuccess('אחוז ההנחה עודכן בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('שגיאה בשמירת אחוז ההנחה:', error);
      setError('שגיאה בשמירת אחוז ההנחה');
    } finally {
      setSaving(false);
    }
  };

  // שמירת תוכן הבאנר
  const saveContent = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await publicSiteService.updateDirectBookingBanner({
        content: editContent
      });
      
      setSettings(prev => ({
        ...prev,
        directBookingBanner: {
          ...prev.directBookingBanner,
          content: editContent
        }
      }));
      
      setSuccess('תוכן הבאנר נשמר בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('שגיאה בשמירת תוכן הבאנר:', error);
      setError('שגיאה בשמירת תוכן הבאנר');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          טוען הגדרות באנר ההזמנה הישירה...
        </Typography>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">
        לא ניתן לטעון את הגדרות הבאנר
      </Alert>
    );
  }

  const banner = settings.directBookingBanner || {
    enabled: true,
    discountPercentage: 15,
    content: {
      he: { text: '15% הנחה בהזמנה ישירה' },
      en: { text: '15% OFF for Direct Booking' }
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h3">
            🎯 באנר הנחת הזמנה ישירה
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={banner.enabled ? 'פעיל' : 'כבוי'} 
              color={banner.enabled ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* בקרת הפעלה/השבתה */}
        <Box mb={3}>
          <FormControlLabel
            control={
              <Switch
                checked={banner.enabled}
                onChange={toggleBanner}
                disabled={saving}
              />
            }
            label={
              <Box>
                <Typography variant="body1">
                  {banner.enabled ? 'הבאנר פעיל באתר הציבורי' : 'הבאנר כבוי באתר הציבורי'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {banner.enabled
                    ? 'הבאנר מוצג מתחת לטופס החיפוש בדף הבית' 
                    : 'הבאנר לא מוצג באתר הציבורי'
                  }
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* עריכת אחוז ההנחה */}
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            אחוז ההנחה
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="אחוז הנחה (%)"
                value={discountPercentage}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    setDiscountPercentage(value);
                  }
                }}
                inputProps={{ min: 0, max: 100, step: 1 }}
                size="small"
                helperText="הזן מספר בין 0 ל-100"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveDiscountPercentage}
                disabled={saving || discountPercentage === banner.discountPercentage}
                size="small"
              >
                שמור אחוז
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                💡 אחוז ההנחה יופיע אוטומטית בטקסט הבאנר. תוכל לשנות את הטקסט ידנית למטה.
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* עריכת תוכן הבאנר */}
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            תוכן הבאנר (מתורגם)
          </Typography>
          
          <Grid container spacing={2}>
            {['he', 'en'].map(lang => (
              <Grid item xs={12} md={6} key={lang}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
                  {lang === 'he' ? '🇮🇱 עברית' : '🇺🇸 English'}
                </Typography>
                <TextField
                  fullWidth
                  label="טקסט הבאנר"
                  value={editContent[lang]?.text || ''}
                  onChange={(e) => {
                    setEditContent(prev => ({
                      ...prev,
                      [lang]: {
                        ...prev[lang],
                        text: e.target.value
                      }
                    }));
                  }}
                  multiline
                  rows={2}
                  size="small"
                  placeholder={lang === 'he' ? '15% הנחה בהזמנה ישירה' : '15% OFF for Direct Booking'}
                />
              </Grid>
            ))}
          </Grid>
          
          <Box mt={2}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveContent}
              disabled={saving}
              size="small"
            >
              שמור תוכן
            </Button>
          </Box>
        </Box>

        {/* מידע נוסף */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>טיפ:</strong> הבאנר מוצג מתחת לטופס החיפוש בדף הבית של האתר הציבורי. 
            השינויים יכנסו לתוקף מיד באתר הציבורי.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DirectBookingBannerControl;

