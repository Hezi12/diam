import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Hotel as HotelIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
  Collections as CollectionsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// קומפוננטים
import SearchBox from '../../components/public-site/SearchBox';
import LocationMap from '../../components/public-site/LocationMap';
import GalleryPreview from '../../components/public-site/GalleryPreview';
import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <PublicSiteLayout>
      {/* חלק עליון - hero section */}
      <Box
        sx={{
          width: '100%',
          minHeight: '500px',
          // backgroundImage: 'url("/images/airport-hero.jpg")',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          mb: 6,
          // שכבה אפלה על התמונה
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" 
          sx={{ 
            position: 'relative', 
            zIndex: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center',
            py: 6 
          }}
        >
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              color: 'white', 
              fontWeight: 700, 
              mb: 2,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            Airport Guest House
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'white', 
              mb: 4, 
              maxWidth: '700px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            }}
          >
            אירוח נוח ואיכותי במרחק דקות מנתב"ג
          </Typography>
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              width: '100%', 
              maxWidth: '900px', 
              borderRadius: '10px',
              bgcolor: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            <SearchBox />
          </Paper>
        </Container>
      </Box>
      
      {/* יתרונות */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: '10px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <LocationOnIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                מיקום מעולה
              </Typography>
              <Typography variant="body2" color="text.secondary">
                5 דקות נסיעה בלבד מנמל התעופה בן גוריון. אידיאלי לנוסעים.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: '10px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <HotelIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                חדרים מרווחים
              </Typography>
              <Typography variant="body2" color="text.secondary">
                חדרים נוחים ומאובזרים לשהייה מושלמת, כולל מיזוג אוויר ו-WiFi חינם.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: '10px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <StarIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                שירות אישי
              </Typography>
              <Typography variant="body2" color="text.secondary">
                צוות אדיב ומקצועי לרשותכם 24/7 לכל בקשה או שאלה במהלך השהייה.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={1} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: '10px',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <InfoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                מחירים הוגנים
              </Typography>
              <Typography variant="body2" color="text.secondary">
                חווית אירוח איכותית במחירים נוחים לכל כיס, ללא עלויות נסתרות.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* אודות */}
      <Box sx={{ bgcolor: '#f7f7f7', py: 8, mb: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                Airport Guest House
              </Typography>
              
              <Typography variant="body1" paragraph>
                ברוכים הבאים ל-Airport Guest House, מלונית המציעה אירוח נוח ואיכותי במחירים תחרותיים, במרחק של דקות בלבד מנמל התעופה בן גוריון.
              </Typography>
              
              <Typography variant="body1" paragraph>
                המלונית שלנו מציעה חדרים מאובזרים היטב, נקיים ומרווחים, המתאימים ליחידים ולמשפחות. כל החדרים כוללים מיזוג אוויר, טלוויזיה, שירותים צמודים וחיבור אינטרנט אלחוטי חינם.
              </Typography>
              
              <Typography variant="body1" paragraph>
                מיקומנו הנוח והנגיש הופך אותנו לבחירה מושלמת עבור נוסעים בטיסות מוקדמות או מאוחרות, אנשי עסקים ומבקרים באזור המרכז.
              </Typography>
              
              <Button 
                component={Link} 
                to="/airport-booking/about-contact" 
                variant="outlined" 
                sx={{ mt: 2 }}
              >
                קרא עוד
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: '300px',
                  background: 'linear-gradient(135deg, #e5e7eb 25%, #d1d5db 25%, #d1d5db 50%, #e5e7eb 50%, #e5e7eb 75%, #d1d5db 75%, #d1d5db 100%)',
                  backgroundSize: '20px 20px',
                  borderRadius: '10px',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" sx={{ backgroundColor: 'white', p: 2, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  חדר במלונית Airport Guest House
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* מפה */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
          המיקום שלנו
        </Typography>
        
        <Paper elevation={2} sx={{ p: 2, borderRadius: '10px' }}>
          <LocationMap />
          
          <Box sx={{ mt: 3, p: 2 }}>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
              רחוב הערבה 5, אור יהודה - 5 דקות נסיעה מנתב"ג
            </Typography>
          </Box>
        </Paper>
      </Container>
      
      {/* גלריה */}
      <Box sx={{ bgcolor: '#f7f7f7', py: 8, mb: -4 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
              גלריה
            </Typography>
            
            <Button 
              component={Link} 
              to="/airport-booking/gallery" 
              startIcon={<CollectionsIcon />}
            >
              לכל התמונות
            </Button>
          </Box>
          
          <GalleryPreview location="airport" limit={6} />
        </Container>
      </Box>
    </PublicSiteLayout>
  );
};

export default HomePage; 