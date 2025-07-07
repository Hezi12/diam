import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Wifi,
  LocalTaxi,
  Phone,
  Info
} from '@mui/icons-material';

const NoticeBoardSettings = () => {
  const [settings, setSettings] = useState({
    wifi: {
      network: "DIAM-Airport-Guest",
      password: "Welcome2024"
    },
    taxi: {
      company: "מוניות אור יהודה",
      phone: "03-5334444"
    },
    emergency: {
      manager: "חזי",
      phone: "050-1234567"
    },
    checkInOut: {
      checkIn: "15:00",
      checkOut: "11:00"
    }
  });

  const [originalSettings, setOriginalSettings] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    // טעינת הגדרות מקומיות (בעתיד ניתן לשלוף מהשרת)
    const savedSettings = localStorage.getItem('noticeBoardSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      setOriginalSettings(parsedSettings);
    } else {
      setOriginalSettings(settings);
    }
  }, []);

  useEffect(() => {
    // בדיקה אם השינויים דורשים שמירה
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setIsDirty(hasChanges);
  }, [settings, originalSettings]);

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    try {
      // שמירה מקומית (בעתיד ניתן לשלוח לשרת)
      localStorage.setItem('noticeBoardSettings', JSON.stringify(settings));
      setOriginalSettings(settings);
      setIsDirty(false);
      setSaveStatus('success');
      
      // הסרת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setSaveStatus(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        הגדרות לוח מודעות - איירפורט
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        כאן תוכל לערוך את המידע הקבוע שמוצג בלוח המודעות עבור האורחים במתחם האיירפורט.
      </Typography>

      {/* הודעות מצב */}
      {saveStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ההגדרות נשמרו בהצלחה!
        </Alert>
      )}
      
      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          אירעה שגיאה בשמירת ההגדרות. אנא נסה שנית.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* הגדרות WiFi */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Wifi color="primary" />
                הגדרות WiFi
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="שם הרשת"
                  value={settings.wifi.network}
                  onChange={(e) => handleInputChange('wifi', 'network', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="סיסמה"
                  value={settings.wifi.password}
                  onChange={(e) => handleInputChange('wifi', 'password', e.target.value)}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* הגדרות מונית */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalTaxi color="primary" />
                הגדרות מונית
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="שם החברה"
                  value={settings.taxi.company}
                  onChange={(e) => handleInputChange('taxi', 'company', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="מספר טלפון"
                  value={settings.taxi.phone}
                  onChange={(e) => handleInputChange('taxi', 'phone', e.target.value)}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* הגדרות יצירת קשר חירום */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Phone color="error" />
                יצירת קשר חירום
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="שם המנהל"
                  value={settings.emergency.manager}
                  onChange={(e) => handleInputChange('emergency', 'manager', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="מספר טלפון"
                  value={settings.emergency.phone}
                  onChange={(e) => handleInputChange('emergency', 'phone', e.target.value)}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* הגדרות שעות צ'ק אין/אאוט */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Info color="primary" />
                שעות צ'ק אין/אאוט
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="שעת כניסה"
                  value={settings.checkInOut.checkIn}
                  onChange={(e) => handleInputChange('checkInOut', 'checkIn', e.target.value)}
                  fullWidth
                  placeholder="15:00"
                />
                <TextField
                  label="שעת יציאה"
                  value={settings.checkInOut.checkOut}
                  onChange={(e) => handleInputChange('checkInOut', 'checkOut', e.target.value)}
                  fullWidth
                  placeholder="11:00"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* כפתורי פעולה */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={!isDirty}
          startIcon={<RefreshIcon />}
        >
          איפוס שינויים
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isDirty}
          startIcon={<SaveIcon />}
        >
          שמירת הגדרות
        </Button>
      </Box>

      {/* הערה */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>הערה:</strong> השינויים יכנסו לתוקף מיד לאחר השמירה וייראו בלוח המודעות.
        </Typography>
      </Alert>
    </Box>
  );
};

export default NoticeBoardSettings; 