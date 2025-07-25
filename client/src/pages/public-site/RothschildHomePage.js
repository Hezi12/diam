import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Button,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  LocationOn as LocationOnIcon,
  Collections as CollectionsIcon,
  CheckCircle as CheckCircleIcon,
  Wifi as WifiIcon,
  LocalParking as LocalParkingIcon,
  AcUnit as AcUnitIcon,
  DirectionsBus as DirectionsBusIcon,
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  Lock as LockIcon,
  Hotel as HotelIcon,
  BedroomParent as BedroomParentIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/public-site/SEOHead';

// קומפוננטים
import SearchBox from '../../components/public-site/SearchBox';
import LocationMap from '../../components/public-site/LocationMap';
import GalleryPreview from '../../components/public-site/GalleryPreview';
import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';
import { usePublicTranslation } from '../../contexts/PublicLanguageContext';
import LaunchPromotionBanner from '../../components/public-site/LaunchPromotionBanner';

const RothschildHomePage = () => {
  const t = usePublicTranslation();
  
  // מערך השירותים עם אייקונים ייחודיים וצבעים שונים
  const services = [
    { nameKey: 'faq.airCondition', icon: <AcUnitIcon />, color: '#0ea5e9' },
    { nameKey: 'faq.bedding', icon: <HotelIcon />, color: '#8b5cf6' },
    { nameKey: 'faq.wifi', icon: <WifiIcon />, color: '#10b981' },
    { nameKey: 'faq.parking', icon: <LocalParkingIcon />, color: '#f59e0b' },
    { nameKey: 'faq.restaurants', icon: <RestaurantIcon />, color: '#ec4899' },
    { nameKey: 'faq.checkin24', icon: <ScheduleIcon />, color: '#06b6d4' },
    { nameKey: 'faq.privacy', icon: <LockIcon />, color: '#84cc16' },
    { nameKey: 'faq.value', icon: <CheckCircleIcon />, color: '#059669' }
  ];

  return (
    <PublicSiteLayout location="rothschild">
      <SEOHead
        title={t('rothschildHome.seoTitle')}
        description={t('rothschildHome.seoDescription')}
        keywords={t('rothschildHome.seoKeywords')}
      />
      
      {/* Launch Promotion Banner */}
      <LaunchPromotionBanner />
      
      {/* Hero Section - טופס חיפוש בלבד */}
      <Box
        sx={{
          width: '100%',
          bgcolor: '#f8fafc',
          py: { xs: 4, sm: 5 },
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Container maxWidth="lg">
          {/* טופס חיפוש על כל השורה */}
          <Paper 
            elevation={1}
            sx={{ 
              p: { xs: 2, sm: 3, md: 4 },
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              bgcolor: 'white'
            }}
          >
            <SearchBox location="rothschild" />
          </Paper>
        </Container>
      </Box>

              {/* מידע על בית הארחה */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
        <Grid container spacing={4} alignItems="flex-start">
          {/* מידע כללי */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 2,
                fontWeight: 600,
                color: '#1e293b',
                fontSize: { xs: '1.5rem', sm: '1.75rem' }
              }}
            >
              <Link 
                to="/rothschild-booking/faq-details" 
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  borderBottom: '2px solid transparent',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.borderBottomColor = '#1e293b'}
                onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}
              >
{t('rothschildHome.title')}
              </Link>
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3,
                color: '#475569',
                fontSize: '1rem',
                lineHeight: 1.6
              }}
            >
{t('rothschildHome.description')}
              {' '}
              <Link 
                to="/rothschild-booking/faq-details"
                style={{ 
                  color: '#1e293b', 
                  textDecoration: 'none',
                  fontWeight: 500,
                  borderBottom: '1px solid #1e293b'
                }}
              >
{t('rothschildHome.moreDetails')}
              </Link>
            </Typography>

            {/* שירותים מאוחדים */}
            <Card 
              variant="outlined" 
              sx={{ 
                border: '1px solid #e2e8f0',
                boxShadow: 'none',
                borderRadius: 2,
                bgcolor: '#fafbfc'
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#334155', fontSize: '1.1rem' }}>
                  {t('rothschildHome.servicesTitle')}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {services.map((service, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            bgcolor: 'white',
                            px: 2,
                            py: 0.75,
                            borderRadius: 1,
                            border: '1px solid #e2e8f0',
                            minWidth: 'fit-content',
                            mb: 0.5
                          }}
                        >
                          <Box 
                            sx={{ 
                              fontSize: 16, 
                              color: service.color, 
                              display: 'flex', 
                              alignItems: 'center',
                              marginLeft: '8px'
                            }}
                          >
                            {service.icon}
                          </Box>
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '0.85rem' }, color: '#64748b', fontWeight: 500 }}>
                            {t(service.nameKey)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* מיקום */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={1}
              sx={{ 
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                height: { xs: '250px', sm: '300px', md: '350px' }
              }}
            >
              <LocationMap location="rothschild" />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* גלריה */}
      <Box sx={{ bgcolor: '#f8fafc', py: 6, borderTop: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <GalleryPreview location="rothschild" limit={6} />
        </Container>
      </Box>
    </PublicSiteLayout>
  );
};

export default RothschildHomePage; 