import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';
import SearchBox from '../../components/public-site/SearchBox';

const SearchResultsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // חילוץ פרמטרים מה-URL
  const searchParams = new URLSearchParams(location.search);
  const checkInStr = searchParams.get('checkIn');
  const checkOutStr = searchParams.get('checkOut');
  
  // בדיקת תקינות פרמטרים
  const validParams = checkInStr && checkOutStr;
  
  // המרה לתאריכים
  const checkIn = validParams ? parseISO(checkInStr) : null;
  const checkOut = validParams ? parseISO(checkOutStr) : null;
  
  // חישוב מספר לילות
  const nightsCount = validParams ? differenceInDays(checkOut, checkIn) : 0;
  
  useEffect(() => {
    // אם אין פרמטרים תקינים, חזור לדף הבית
    if (!validParams) {
      navigate('/airport-booking');
      return;
    }
    
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // קבלת כל החדרים מהמיקום הרלוונטי דרך ה-API הציבורי
        const roomsResponse = await axios.get(`${API_URL}${API_ENDPOINTS.rooms.public.byLocation('airport')}`);
        setRooms(roomsResponse.data);
        
        // בדיקת זמינות עבור כל חדר דרך ה-API הציבורי
        const availabilityPromises = roomsResponse.data.map(room => 
          axios.get(`${API_URL}/api/bookings/check-availability`, {
            params: {
              roomId: room._id,
              checkIn: checkInStr,
              checkOut: checkOutStr
            }
          })
        );
        
        const availabilityResults = await Promise.all(availabilityPromises);
        
        // סינון רק חדרים זמינים
        const available = roomsResponse.data.filter((room, index) => 
          availabilityResults[index].data.available
        );
        
        setAvailableRooms(available);
      } catch (err) {
        console.error('שגיאה בטעינת חדרים:', err);
        setError('אירעה שגיאה בטעינת החדרים. אנא נסה שנית.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [checkInStr, checkOutStr, navigate, validParams]);
  
  // פורמט תאריכים לתצוגה
  const formattedCheckIn = validParams ? format(checkIn, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  const formattedCheckOut = validParams ? format(checkOut, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  
  // נוסיף פונקציית עזר ליצירת תמונת דמה
  const renderRoomImage = (room) => {
    // בדיקה אם יש תמונה זמינה
    if (room.images && room.images.length > 0 && room.images[0]) {
      return (
        <CardMedia
          component="img"
          height="200"
          image={room.images[0]}
          alt={room.category}
        />
      );
    }
    
    // אם אין תמונה, נציג תמונת דמה
    return (
      <Box
        sx={{
          height: 200,
          background: 'linear-gradient(135deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb 100%)',
          backgroundSize: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280'
        }}
      >
        <Typography variant="body2" sx={{ backgroundColor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1 }}>
          {`חדר ${room.category} - ${room.roomNumber}`}
        </Typography>
      </Box>
    );
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
          
          <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
            תוצאות חיפוש
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body1">
              {formattedCheckIn} - {formattedCheckOut} ({nightsCount} לילות)
            </Typography>
          </Box>
          
          <Paper elevation={1} sx={{ p: 2, mb: 4, borderRadius: '10px' }}>
            <SearchBox />
          </Paper>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : availableRooms.length === 0 ? (
          <Alert severity="info" sx={{ mb: 4 }}>
            אין חדרים זמינים בתאריכים שנבחרו. אנא נסה תאריכים אחרים.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {availableRooms.map((room) => (
              <Grid item xs={12} md={6} lg={4} key={room._id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '10px',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {renderRoomImage(room)}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2" fontWeight={600}>
                        {room.category}
                      </Typography>
                      <Chip 
                        label={`חדר ${room.roomNumber}`} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', color: 'primary.main' }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {room.description || 'חדר מאובזר ונוח למנוחה מושלמת. כולל מזגן, טלוויזיה ומקלחת פרטית.'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {room.amenities && room.amenities.map((amenity, idx) => (
                        <Chip 
                          key={idx} 
                          label={amenity} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        עד {room.maxOccupancy} אורחים
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={600}>
                        {room.vatPrice} ₪ / לילה
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {nightsCount * room.vatPrice} ₪ סה"כ
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      component={Link}
                      to={`/airport-booking/book?roomId=${room._id}&checkIn=${checkInStr}&checkOut=${checkOutStr}`}
                      sx={{ fontWeight: 500 }}
                    >
                      הזמן עכשיו
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </PublicSiteLayout>
  );
};

export default SearchResultsPage; 