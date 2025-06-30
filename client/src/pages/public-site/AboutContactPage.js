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
import { usePublicTranslation } from '../../contexts/PublicLanguageContext';

const AboutContactPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const t = usePublicTranslation();
  
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
      errors.name = t('contact.form.errors.nameRequired');
    }
    
    if (!contactForm.email.trim()) {
      errors.email = t('contact.form.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(contactForm.email)) {
      errors.email = t('contact.form.errors.emailInvalid');
    }
    
    if (!contactForm.phone.trim()) {
      errors.phone = t('contact.form.errors.phoneRequired');
    }
    
    if (!contactForm.message.trim()) {
      errors.message = t('contact.form.errors.messageRequired');
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
      setError(t('contact.form.errors.submitError'));
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
            sx={{ mb: 2, gap: 1.5 }}
          >
{t('common.backToHome')}
          </Button>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={t('about.tabs.about')} />
            <Tab label={t('about.tabs.contact')} />
          </Tabs>
          
          {/* תוכן טאב אודות */}
          {tabValue === 0 && (
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
                  {t('about.title')}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {t('about.description1')}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {t('about.description2')}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {t('about.description3')}
                </Typography>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                  {t('about.facilitiesTitle')}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={6}>
                    <Box component="ul" sx={{ pl: 2, margin: 0 }}>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.parking')}</Box>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.wifi')}</Box>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.ac')}</Box>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.tv')}</Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box component="ul" sx={{ pl: 2, margin: 0 }}>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.shower')}</Box>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.linens')}</Box>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.kitchen')}</Box>
                      <Box component="li" sx={{ mb: 1 }}>{t('about.facilities.cleaning')}</Box>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                  {t('about.hoursTitle')}
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  <strong>{t('about.hours.checkIn')}:</strong> 15:00 - 22:00
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  <strong>{t('about.hours.checkOut')}:</strong> {t('about.hours.checkOutTime')}
                </Typography>
                
                <Alert severity="info" sx={{ mt: 3 }}>
                  {t('about.hours.lateCheckInNote')}
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box
                  component="img"
                  src="/images/airport-building.jpg"
                  alt={t('about.imageAlt')}
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
                    {t('about.locationTitle')}
                  </Typography>
                  
                  <LocationMap />
                  
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1">
                        {t('about.address')}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                      {t('about.distanceFromAirport')}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ color: 'primary.main', mr: 1 }} />
                                          <Typography variant="body1">
                      <a href="tel:+972506070260" style={{ color: 'inherit', textDecoration: 'none' }}>
                        050-607-0260
                      </a>
                    </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ color: 'primary.main', mr: 1 }} />
                                          <Typography variant="body1">
                      <a href="mailto:diamshotels@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                        diamshotels@gmail.com
                      </a>
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
                  {t('contact.title')}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {t('contact.description')}
                </Typography>
                
                <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: '10px' }}>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          name="name"
                          label={t('contact.form.name')}
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
                          label={t('contact.form.email')}
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
                          label={t('contact.form.phone')}
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
                          label={t('contact.form.message')}
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
                          sx={{ gap: 1.5 }}
                        >
{t('contact.form.submit')}
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
                    {t('contact.details.title')}
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1" fontWeight={500}>
                        {t('contact.details.phone')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 4 }}>
                      <a href="tel:+972506070260" style={{ color: 'inherit', textDecoration: 'none' }}>
                        050-607-0260
                      </a>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1" fontWeight={500}>
                        {t('contact.details.email')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 4 }}>
                      <a href="mailto:diamshotels@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                        diamshotels@gmail.com
                      </a>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="body1" fontWeight={500}>
                        {t('contact.details.address')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 4 }}>
                      {t('about.address')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      {t('about.distanceFromAirport')}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {t('about.locationTitle')}
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
          {t('contact.form.successMessage')}
        </Alert>
      </Snackbar>
    </PublicSiteLayout>
  );
};

export default AboutContactPage; 