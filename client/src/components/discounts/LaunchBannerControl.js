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
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import publicSiteService from '../../services/publicSiteService';

/**
 * קומפוננט לניהול באנר הנחת השקה
 * מאפשר הפעלה/השבתה ועריכת תוכן הבאנר מהמערכת הפנימית
 */
const LaunchBannerControl = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState({});

  // טעינת הגדרות הבאנר
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await publicSiteService.getPublicSiteSettings();
      setSettings(response);
      setEditContent(response.launchPromotionBanner.content);
      
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
      
      const response = await publicSiteService.toggleLaunchBanner();
      
      setSettings(prev => ({
        ...prev,
        launchPromotionBanner: {
          ...prev.launchPromotionBanner,
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

  // שמירת תוכן הבאנר
  const saveContent = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await publicSiteService.updateBannerContent(editContent);
      
      setSettings(prev => ({
        ...prev,
        launchPromotionBanner: {
          ...prev.launchPromotionBanner,
          content: editContent
        }
      }));
      
      setEditMode(false);
      setSuccess('תוכן הבאנר נשמר בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('שגיאה בשמירת תוכן הבאנר:', error);
      setError('שגיאה בשמירת תוכן הבאנר');
    } finally {
      setSaving(false);
    }
  };

  // ביטול עריכה
  const cancelEdit = () => {
    setEditContent(settings.launchPromotionBanner.content);
    setEditMode(false);
  };

  // עדכון תוכן בעריכה
  const updateEditContent = (language, field, value) => {
    setEditContent(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          טוען הגדרות באנר הנחת השקה...
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

  const banner = settings.launchPromotionBanner;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h3">
            🎉 באנר הנחת השקה
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={banner.enabled ? 'פעיל' : 'כבוי'} 
              color={banner.enabled ? 'success' : 'default'}
              size="small"
            />
            
            {banner.enabled && (
              <Chip 
                label={banner.isCurrentlyValid ? 'בתוקף' : 'לא בתוקף'} 
                color={banner.isCurrentlyValid ? 'primary' : 'warning'}
                size="small"
              />
            )}
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
                  {banner.enabled && banner.isCurrentlyValid
                    ? 'המבקרים באתר הציבורי יראו את באנר ההנחה' 
                    : banner.enabled && !banner.isCurrentlyValid
                    ? 'הבאנר פעיל אבל לא בתוקף (בדוק תאריכי תוקף)'
                    : 'המבקרים באתר הציבורי לא יראו את באנר ההנחה'
                  }
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* עריכת תוכן הבאנר */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            תוכן הבאנר
          </Typography>
          
          {!editMode ? (
            <Button
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
              variant="outlined"
              size="small"
            >
              ערוך תוכן
            </Button>
          ) : (
            <Box display="flex" gap={1}>
              <Button
                startIcon={<SaveIcon />}
                onClick={saveContent}
                variant="contained"
                size="small"
                disabled={saving}
              >
                שמור
              </Button>
              <Button
                startIcon={<CancelIcon />}
                onClick={cancelEdit}
                variant="outlined"
                size="small"
                disabled={saving}
              >
                ביטול
              </Button>
            </Box>
          )}
        </Box>

        {/* תצוגה/עריכה של התוכן */}
        {['he', 'en'].map(lang => (
          <Box key={lang} mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              {lang === 'he' ? '🇮🇱 עברית' : '🇺🇸 English'}
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(banner.content[lang] || {}).map(([field, value]) => (
                <Grid item xs={12} md={6} key={field}>
                  <TextField
                    fullWidth
                    label={getFieldLabel(field)}
                    value={editMode ? (editContent[lang]?.[field] || '') : value}
                    onChange={editMode ? (e) => updateEditContent(lang, field, e.target.value) : undefined}
                    disabled={!editMode}
                    multiline={field === 'description' || field === 'limitation'}
                    rows={field === 'description' || field === 'limitation' ? 2 : 1}
                    size="small"
                    sx={{ 
                      '& .MuiInputBase-input': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {/* מידע נוסף */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>טיפ:</strong> השינויים יכנסו לתוקף מיד באתר הציבורי. 
            המבקרים שכבר ראו את הבאנר עשויים לראות אותו שוב בהתאם להגדרות התצוגה.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// פונקציה לקבלת תווית השדה
const getFieldLabel = (field) => {
  const labels = {
    title: 'כותרת',
    discount: 'טקסט ההנחה',
    description: 'תיאור',
    couponText: 'טקסט הקופון',
    couponCode: 'קוד הקופון',
    limitation: 'הגבלות',
    button: 'טקסט הכפתור'
  };
  
  return labels[field] || field;
};

export default LaunchBannerControl;
