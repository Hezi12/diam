import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Language as LanguageIcon,
  Hotel as HotelIcon
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';

const EmailPreview = () => {
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState(0);
  const [location, setLocation] = useState('airport');
  const [language, setLanguage] = useState('he');
  const [emailPreview, setEmailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showTestDialog, setShowTestDialog] = useState(false);

  // טעינת תצוגה מקדימה בטעינת הדף
  useEffect(() => {
    loadEmailPreview();
    checkConnection();
  }, [location, language]);

  // פונקציה לטעינת תצוגה מקדימה
  const loadEmailPreview = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/email/preview', {
        params: { location, language }
      });
      
      if (response.data.success) {
        setEmailPreview(response.data.preview);
      }
    } catch (error) {
      console.error('שגיאה בטעינת תצוגה מקדימה:', error);
      setTestResult({
        success: false,
        message: 'שגיאה בטעינת תצוגה מקדימה'
      });
    } finally {
      setLoading(false);
    }
  };

  // בדיקת חיבור Gmail
  const checkConnection = async () => {
    try {
      const response = await axios.get('/api/email/connection');
      setConnectionStatus(response.data);
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: 'שגיאה בחיבור Gmail'
      });
    }
  };

  // שליחת מייל בדיקה
  const sendTestEmail = async () => {
    setSendingTest(true);
    try {
      const response = await axios.post('/api/email/test', {
        email: testEmail || 'diamshotels@gmail.com'
      });
      
      setTestResult({
        success: true,
        message: response.data.message
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.error || 'שגיאה בשליחת מייל בדיקה'
      });
    } finally {
      setSendingTest(false);
      setShowTestDialog(false);
    }
  };

  // שליחת הזמנה לדוגמה
  const sendSampleBooking = async () => {
    setSendingTest(true);
    try {
      const response = await axios.post('/api/email/send-sample', {
        location,
        language,
        email: testEmail || 'diamshotels@gmail.com'
      });
      
      setTestResult({
        success: true,
        message: response.data.message
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.error || 'שגיאה בשליחת הזמנה לדוגמה'
      });
    } finally {
      setSendingTest(false);
      setShowTestDialog(false);
    }
  };

  const getLocationName = (loc) => {
    return loc === 'airport' ? 'Airport Guest House' : 'Rothschild 79';
  };

  const getLanguageName = (lang) => {
    return lang === 'he' ? 'עברית' : 'English';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* כותרת */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          📧 תצוגה מקדימה - מיילים
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          צפייה ובדיקה של מיילי אישור הזמנה לפני שליחה ללקוחות
        </Typography>
      </Box>

      {/* סטטוס חיבור */}
      {connectionStatus && (
        <Alert 
          severity={connectionStatus.success ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          icon={connectionStatus.success ? <CheckCircleIcon /> : <ErrorIcon />}
        >
          {connectionStatus.success 
            ? '✅ חיבור Gmail פעיל ותקין'
            : `❌ ${connectionStatus.error}`
          }
        </Alert>
      )}

      {/* התראות */}
      {testResult && (
        <Alert 
          severity={testResult.success ? 'success' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setTestResult(null)}
        >
          {testResult.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* פאנל שמאל - בקרות */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <PreviewIcon sx={{ mr: 1 }} />
              הגדרות תצוגה
            </Typography>

            {/* בחירת מלון */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>מלון</InputLabel>
              <Select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                startAdornment={<HotelIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="airport">
                  Airport Guest House
                </MenuItem>
                <MenuItem value="rothschild">
                  Rothschild 79
                </MenuItem>
              </Select>
            </FormControl>

            {/* בחירת שפה */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>שפה</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                startAdornment={<LanguageIcon sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="he">עברית</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>

            {/* כפתור רענון */}
            <Button
              fullWidth
              variant="outlined"
              onClick={loadEmailPreview}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              sx={{ mb: 3 }}
            >
              {loading ? 'טוען...' : 'רענן תצוגה'}
            </Button>

            <Divider sx={{ my: 3 }} />

            {/* כפתורי בדיקה */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              🧪 בדיקות מייל
            </Typography>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => setShowTestDialog(true)}
              startIcon={<SendIcon />}
              sx={{ mb: 2 }}
            >
              שלח מייל בדיקה
            </Button>

            <Button
              fullWidth
              variant="contained"
              color="secondary" 
              onClick={() => setShowTestDialog(true)}
              startIcon={<EmailIcon />}
            >
              שלח הזמנה לדוגמה
            </Button>

            {/* פרטי התצוגה הנוכחית */}
            {emailPreview && (
              <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    פרטי התצוגה:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={getLocationName(location)} 
                      size="small" 
                      color="primary" 
                    />
                    <Chip 
                      label={getLanguageName(language)} 
                      size="small" 
                      color="secondary" 
                    />
                    <Chip 
                      label={`הזמנה #${emailPreview.booking?.bookingNumber}`} 
                      size="small" 
                    />
                  </Box>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>

        {/* תצוגה מקדימה של המייל */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '80vh', overflow: 'hidden' }}>
            {/* כותרת המייל */}
            {emailPreview && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="h6" noWrap>
                  📧 {emailPreview.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  From: Diam Hotels &lt;diamshotels@gmail.com&gt;
                </Typography>
              </Box>
            )}

            {/* תוכן המייל */}
            <Box sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : emailPreview ? (
                <Box 
                  sx={{ p: 2 }}
                  dangerouslySetInnerHTML={{ __html: emailPreview.html }}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">
                    בחר הגדרות ולחץ על "רענן תצוגה"
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* דיאלוג שליחת מייל בדיקה */}
      <Dialog open={showTestDialog} onClose={() => setShowTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          📧 שליחת מייל בדיקה
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="כתובת מייל"
            type="email"
            fullWidth
            variant="outlined"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="diamshotels@gmail.com"
            helperText="השאר ריק לשליחה לכתובת ברירת המחדל"
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            המייל יישלח עם הגדרות התצוגה הנוכחיות: <strong>{getLocationName(location)}</strong> ב<strong>{getLanguageName(language)}</strong>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestDialog(false)}>
            ביטול
          </Button>
          <Button 
            onClick={sendTestEmail}
            disabled={sendingTest}
            startIcon={sendingTest ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sendingTest ? 'שולח...' : 'שלח מייל בדיקה'}
          </Button>
          <Button 
            onClick={sendSampleBooking}
            disabled={sendingTest}
            variant="contained"
            startIcon={sendingTest ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sendingTest ? 'שולח...' : 'שלח הזמנה לדוגמה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmailPreview; 