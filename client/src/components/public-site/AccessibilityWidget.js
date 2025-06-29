import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Button,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  useTheme
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  Close as CloseIcon,
  TextIncrease as TextIncreaseIcon,
  TextDecrease as TextDecreaseIcon,
  Contrast as ContrastIcon,
  Link as LinkIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const AccessibilityWidget = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const t = useTranslation();
  const [settings, setSettings] = useState({
    fontSize: 100,
    highContrast: false,
    highlightLinks: false,
    stopAnimations: false,
    underlineLinks: false
  });

  // טעינת הגדרות מ-localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error(t('accessibility.settingsError'), error);
      }
    }
  }, []);

  // שמירת הגדרות ל-localStorage
  const saveSettings = (newSettings) => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
  };

  // החלת ההגדרות על הדף
  const applySettings = (currentSettings) => {
    const root = document.documentElement;
    
    // הגדלת טקסט
    root.style.fontSize = `${currentSettings.fontSize}%`;
    
    // ניגודיות גבוהה
    if (currentSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // הדגשת קישורים
    if (currentSettings.highlightLinks) {
      root.classList.add('highlight-links');
    } else {
      root.classList.remove('highlight-links');
    }
    
    // קו תחתון לקישורים
    if (currentSettings.underlineLinks) {
      root.classList.add('underline-links');
    } else {
      root.classList.remove('underline-links');
    }
    
    // עצירת אנימציות
    if (currentSettings.stopAnimations) {
      root.classList.add('stop-animations');
    } else {
      root.classList.remove('stop-animations');
    }
  };

  // עדכון הגדרה ספציפית
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    applySettings(newSettings);
  };

  // איפוס הגדרות
  const resetSettings = () => {
    const defaultSettings = {
      fontSize: 100,
      highContrast: false,
      highlightLinks: false,
      stopAnimations: false,
      underlineLinks: false
    };
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  // הוספת CSS לדף
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* ניגודיות גבוהה */
      html.high-contrast {
        filter: contrast(150%) !important;
      }
      html.high-contrast * {
        background-color: white !important;
        color: black !important;
        border-color: black !important;
      }
      html.high-contrast a {
        color: blue !important;
        text-decoration: underline !important;
      }
      html.high-contrast button {
        background-color: yellow !important;
        color: black !important;
        border: 2px solid black !important;
      }
      
      /* הדגשת קישורים */
      html.highlight-links a {
        background-color: yellow !important;
        color: black !important;
        padding: 2px 4px !important;
        border-radius: 3px !important;
        font-weight: bold !important;
      }
      
      /* קו תחתון לקישורים */
      html.underline-links a {
        text-decoration: underline !important;
        text-decoration-thickness: 2px !important;
      }
      
      /* עצירת אנימציות */
      html.stop-animations *,
      html.stop-animations *::before,
      html.stop-animations *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* כפתור צף */}
      <Fab
        color="primary"
        size="medium"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 9999,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        aria-label={t('accessibility.openMenu')}
      >
        <AccessibilityIcon />
      </Fab>

      {/* דיאלוג הגדרות נגישות */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            direction: 'rtl'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {t('accessibility.title')}
          </Typography>
          <IconButton 
            onClick={() => setOpen(false)}
            size="small"
            aria-label="סגור"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {/* הגדלת טקסט */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              {t('accessibility.fontSize')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextDecreaseIcon color="action" />
              <Slider
                value={settings.fontSize}
                onChange={(e, value) => updateSetting('fontSize', value)}
                min={75}
                max={150}
                step={25}
                marks={[
                  { value: 75, label: 'קטן' },
                  { value: 100, label: 'רגיל' },
                  { value: 125, label: 'גדול' },
                  { value: 150, label: 'ענק' }
                ]}
                sx={{ flex: 1 }}
                aria-label="גודל טקסט"
              />
              <TextIncreaseIcon color="action" />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ניגודיות גבוהה */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.highContrast}
                onChange={(e) => updateSetting('highContrast', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContrastIcon />
                <Typography>ניגודיות גבוהה</Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />

          {/* הדגשת קישורים */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.highlightLinks}
                onChange={(e) => updateSetting('highlightLinks', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon />
                <Typography>הדגשת קישורים</Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />

          {/* קו תחתון לקישורים */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.underlineLinks}
                onChange={(e) => updateSetting('underlineLinks', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon />
                <Typography>קו תחתון לקישורים</Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />

          {/* עצירת אנימציות */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.stopAnimations}
                onChange={(e) => updateSetting('stopAnimations', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StopIcon />
                <Typography>עצור אנימציות</Typography>
              </Box>
            }
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* כפתור איפוס */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<RefreshIcon />}
            onClick={resetSettings}
            sx={{ mt: 2 }}
          >
{t('accessibility.reset')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccessibilityWidget; 