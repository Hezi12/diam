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
  AcUnit as AcUnitIcon
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
        <Grid container spacing={6}>
          {/* מידע כללי */}
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                mb: 3,
                fontWeight: 500,
                color: '#1e293b',
                fontSize: { xs: '1.75rem', sm: '2rem' }
              }}
            >
              מלונית Airport Guest House
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3,
                color: '#475569',
                fontSize: '1.1rem',
                lineHeight: 1.7
              }}
            >
              מציעה חדרים נקיים ומאובזרים במרחק נסיעה קצר מנמל התעופה בן גוריון. 
              מתאימה לנוסעים, אנשי עסקים ומשפחות המחפשים מקום לינה נוח ואמין.
            </Typography>

            {/* שירותים זמינים */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    p: 2,
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none'
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: '#334155' }}>
                      בחדר
                    </Typography>
                    <Box component="ul" sx={{ pl: 0, m: 0, listStyle: 'none' }}>
                      <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">מיזוג אוויר</Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">טלוויזיה</Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">מקלחת פרטית</Typography>
                      </Box>
                      <Box component="li" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">מצעים ומגבות</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    p: 2,
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none'
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: '#334155' }}>
                      שירותים כלליים
                    </Typography>
                    <Box component="ul" sx={{ pl: 0, m: 0, listStyle: 'none' }}>
                      <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">Wi-Fi חינם</Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">חניה חינם</Typography>
                      </Box>
                      <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">מטבחון משותף</Typography>
                      </Box>
                      <Box component="li" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 16, color: '#059669' }} />
                        <Typography variant="body2" color="#64748b">שירותי ניקיון</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>


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