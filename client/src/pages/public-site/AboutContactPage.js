import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  TextField,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from 'axios';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';
import LocationMap from '../../components/public-site/LocationMap';

const AboutContactPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // טיפול בשינוי טאב
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // טיפול בשינויים בטופס
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm({
      ...contactForm,
      [name]: value
    });
    
    // ניקוי שגיאות בעת שינוי
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // אימות טופס יצירת קשר
  const validateForm = () => {
    const errors = {};
    
    if (!contactForm.name.trim()) {
      errors.name = 'נא להזין שם מלא';
    }
    
    if (!contactForm.email.trim()) {
      errors.email = 'נא להזין כתובת אימייל';
    } else if (!/\S+@\S+\.\S+/.test(contactForm.email)) {
      errors.email = 'כתובת האימייל אינה תקינה';
    }
    
    if (!contactForm.phone.trim()) {
      errors.phone = 'נא להזין מספר טלפון';
    }
    
    if (!contactForm.message.trim()) {
      errors.message = 'נא להזין את תוכן ההודעה';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // שליחת טופס יצירת קשר
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // בפרויקט אמיתי: שליחת הנתונים לשרת
      // כרגע דימוי של בקשת רשת
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // איפוס הטופס
      setContactForm({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      setSuccess(true);
    } catch (err) {
      console.error('שגיאה בשליחת הטופס:', err);
      setError('אירעה שגיאה בשליחת הטופס. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };
  
  // סגירת הודעת הצלחה
  const handleCloseSuccess = () => {
    setSuccess(false);
  };
  
  return (
    <PublicSiteLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            to="/airport-booking"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
          >
            חזרה לדף הבית
          </Button>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="אודות המלונית" />
            <Tab label="צור קשר" />
          </Tabs>
          
          {/* תוכן טאב אודות */}
          {tabValue === 0 && (
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
                  אודות Airport Guest House
                </Typography>
                
                <Typography variant="body1" paragraph>
                  מלונית Airport Guest House ממוקמת במרחק של דקות ספורות מנמל התעופה בן גוריון, ומציעה אירוח איכותי במחירים נוחים לכל כיס.
                </Typography>
                
                <Typography variant="body1" paragraph>
                  המלונית נבנתה בשנת 2020 ומציעה חדרים מודרניים, נקיים ומאובזרים היטב, וזאת במחירים תחרותיים. כל החדרים כוללים מיזוג אוויר, טלוויזיה, Wi-Fi חינם ושירותים צמודים.
                </Typography>
                
                <Typography variant="body1" paragraph>
                  המיקום האסטרטגי של המלונית בקרבת שדה התעופה הופך אותה לפתרון מושלם למטיילים הנוחתים או ממריאים מנתב"ג, אנשי עסקים, או מבקרים המחפשים מקום לינה נוח באזור המרכז.
                </Typography>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                  המתקנים שלנו
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <Box component="ul" sx={{ pl: 2, margin: 0 }}>
                      <Box component="li" sx={{ mb: 1 }}>חניה חינם</Box>
                      <Box component="li" sx={{ mb: 1 }}>Wi-Fi חינם</Box>
                      <Box component="li" sx={{ mb: 1 }}>מיזוג אוויר</Box>
                      <Box component="li" sx={{ mb: 1 }}>טלוויזיה</Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box component="ul" sx={{ pl: 2, margin: 0 }}>
                      <Box component="li" sx={{ mb: 1 }}>מקלחת פרטית</Box>
                      <Box component="li" sx={{ mb: 1 }}>מגבות ומצעים</Box>
                      <Box component="li" sx={{ mb: 1 }}>מטבחון משותף</Box>
                      <Box component="li" sx={{ mb: 1 }}>שירותי ניקיון</Box>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                  שעות פעילות
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  <strong>קבלה (צ'ק-אין):</strong> 15:00 - 22:00
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  <strong>עזיבה (צ'ק-אאוט):</strong> עד 11:00
                </Typography>
                
                <Alert severity="info" sx={{ mt: 3 }}>
                  ניתן לתאם צ'ק-אין מאוחר בתיאום מראש דרך הטלפון.
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box
                  component="img"
                  src="/images/airport-building.jpg"
                  alt="מלונית Airport Guest House"
                  sx={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover',
                    borderRadius: '10px',
                    mb: 4
                  }}
                />
                
                <Paper elevation={1} sx={{ p: 3, borderRadius: '10px' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    המיקום שלנו
                  </Typography>
                  
                  <LocationMap />
                  
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1">
                        רחוב הערבה 5, אור יהודה
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                      5 דקות נסיעה מנמל התעופה בן גוריון
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1">
                        03-123-4567
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1">
                        info@airport-guesthouse.com
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* תוכן טאב צור קשר */}
          {tabValue === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
                  צור קשר
                </Typography>
                
                <Typography variant="body1" paragraph>
                  אנו זמינים לכל שאלה, בקשה או הצעה. מלאו את הטופס ונחזור אליכם בהקדם האפשרי.
                </Typography>
                
                <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: '10px' }}>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          name="name"
                          label="שם מלא"
                          fullWidth
                          value={contactForm.name}
                          onChange={handleInputChange}
                          error={!!formErrors.name}
                          helperText={formErrors.name}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="email"
                          label="אימייל"
                          type="email"
                          fullWidth
                          value={contactForm.email}
                          onChange={handleInputChange}
                          error={!!formErrors.email}
                          helperText={formErrors.email}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="phone"
                          label="טלפון"
                          fullWidth
                          value={contactForm.phone}
                          onChange={handleInputChange}
                          error={!!formErrors.phone}
                          helperText={formErrors.phone}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="message"
                          label="תוכן ההודעה"
                          multiline
                          rows={4}
                          fullWidth
                          value={contactForm.message}
                          onChange={handleInputChange}
                          error={!!formErrors.message}
                          helperText={formErrors.message}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        >
                          שלח הודעה
                        </Button>
                        
                        {error && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                          </Alert>
                        )}
                      </Grid>
                    </Grid>
                  </form>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: '10px' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    פרטי התקשרות
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1" fontWeight={500}>
                        טלפון
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 4 }}>
                      03-123-4567
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1" fontWeight={500}>
                        אימייל
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 4 }}>
                      info@airport-guesthouse.com
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1" fontWeight={500}>
                        כתובת
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 4 }}>
                      רחוב הערבה 5, אור יהודה
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      5 דקות נסיעה מנמל התעופה בן גוריון
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    המיקום שלנו
                  </Typography>
                  <LocationMap />
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Container>
      
      {/* הודעת הצלחה */}
      <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.
        </Alert>
      </Snackbar>
    </PublicSiteLayout>
  );
};

export default AboutContactPage; 