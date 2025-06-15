import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Button
} from '@mui/material';
import { 
  LocationOn as LocationOnIcon,
  Collections as CollectionsIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// קומפוננטים
import SearchBox from '../../components/public-site/SearchBox';
import LocationMap from '../../components/public-site/LocationMap';
import GalleryPreview from '../../components/public-site/GalleryPreview';
import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

const HomePage = () => {
  return (
    <PublicSiteLayout>
      {/* Hero Section - מינימליסטי */}
      <Box
        sx={{
          width: '100%',
          minHeight: '450px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          mb: 8,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.2)',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center', py: 6 }}>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              color: 'white', 
              mb: 2, 
              fontWeight: 300,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
              letterSpacing: '0.5px'
            }}
          >
            אירוח איכותי במרחק דקות מנתב"ג
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              mb: 5, 
              fontWeight: 300,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            מלונית נוחה ומקצועית לנוסעים ואנשי עסקים
          </Typography>
          
          <Paper 
            elevation={8} 
            sx={{ 
              p: { xs: 3, sm: 4 }, 
              maxWidth: '700px', 
              mx: 'auto',
              borderRadius: '16px',
              bgcolor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            <SearchBox />
          </Paper>
        </Container>
      </Box>
      
      {/* תיאור ומיקום */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={6} alignItems="center">
          {/* תיאור */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 4, 
                fontWeight: 600, 
                color: 'text.primary',
                fontSize: { xs: '1.8rem', sm: '2rem' }
              }}
            >
              למה לבחור בנו?
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: '1.1rem', mb: 3 }}>
              Airport Guest House מציעה אירוח איכותי במחירים הוגנים, במיקום מושלם 
              למטיילים ואנשי עסקים.
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: '1.1rem', mb: 4 }}>
              חדרים מאובזרים ונוחים, שירות אישי ומקצועי, וקרבה מקסימלית לנמל התעופה 
              בן גוריון - הכל במקום אחד.
            </Typography>
            
            <Button 
              component={Link} 
              to="/airport-booking/about-contact" 
              variant="contained" 
              size="large"
              sx={{ 
                mt: 2, 
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              קרא עוד עלינו
            </Button>
          </Grid>
          
          {/* מיקום */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h5" 
              component="h3" 
              sx={{ 
                mb: 3, 
                fontWeight: 600, 
                textAlign: 'center',
                color: 'text.primary'
              }}
            >
              המיקום שלנו
            </Typography>
            
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              <LocationMap />
              <Box sx={{ mt: 3, textAlign: 'center', bgcolor: '#f8fafc', p: 2, borderRadius: '8px' }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 500,
                    color: 'text.primary'
                  }}
                >
                  <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                  רחוב הערבה 5, אור יהודה
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  5 דקות נסיעה מנמל התעופה בן גוריון
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* גלריה */}
      <Box sx={{ bgcolor: '#f8fafc', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              גלריה
            </Typography>
            
            <Button 
              component={Link} 
              to="/airport-booking/gallery" 
              startIcon={<CollectionsIcon />}
              variant="outlined"
              sx={{ 
                borderRadius: '12px',
                px: 3,
                py: 1,
                textTransform: 'none'
              }}
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