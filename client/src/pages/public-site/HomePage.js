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

// קומפוננטים
import SearchBox from '../../components/public-site/SearchBox';
import LocationMap from '../../components/public-site/LocationMap';
import GalleryPreview from '../../components/public-site/GalleryPreview';
import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';

const HomePage = () => {
  // מערך השירותים עם אייקונים ייחודיים וצבעים שונים
  const services = [
    { name: 'מיזוג אוויר', icon: <AcUnitIcon />, color: '#0ea5e9' },
    { name: 'מצעים ומגבות', icon: <HotelIcon />, color: '#8b5cf6' },
    { name: 'Wi-Fi חינמי', icon: <WifiIcon />, color: '#10b981' },
    { name: 'חניה חינם', icon: <LocalParkingIcon />, color: '#f59e0b' },
    { name: 'שירותי הסעות (בתוספת תשלום)', icon: <DirectionsBusIcon />, color: '#ef4444' },
    { name: 'מסעדות בקרבה', icon: <RestaurantIcon />, color: '#ec4899' },
    { name: 'צ\'ק-אין 24/7', icon: <ScheduleIcon />, color: '#06b6d4' },
    { name: 'פרטיות מלאה', icon: <LockIcon />, color: '#84cc16' },
    { name: 'תמורה מלאה למחיר', icon: <CheckCircleIcon />, color: '#059669' }
  ];

  return (
    <PublicSiteLayout>
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
              p: 4,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              bgcolor: 'white'
            }}
          >
            <SearchBox />
          </Paper>
        </Container>
      </Box>

      {/* מידע על המלונית */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
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
              מלונית Airport Guest House
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
              המלונית המובילה באזור נמל התעופה בן גוריון. 
              חדרים מודרניים ומאובזרים עם שירות מקצועי - 
              הפתרון המושלם לנוסעים ואנשי עסקים.
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
                  השירותים והמתקנים שלנו
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
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                            {service.name}
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
                height: '350px'
              }}
            >
              <LocationMap />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* גלריה */}
      <Box sx={{ bgcolor: '#f8fafc', py: 6, borderTop: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <GalleryPreview location="airport" limit={6} />
        </Container>
      </Box>
    </PublicSiteLayout>
  );
};

export default HomePage; 