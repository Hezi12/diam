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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Wifi as WifiIcon,
  AcUnit as AcUnitIcon,
  LocalParking as ParkingIcon,
  Tv as TvIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';
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
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  
  // חילוץ פרמטרים מה-URL
  const searchParams = new URLSearchParams(location.search);
  const checkInStr = searchParams.get('checkIn');
  const checkOutStr = searchParams.get('checkOut');
  const nightsStr = searchParams.get('nights');
  const guestsStr = searchParams.get('guests');
  const isTouristStr = searchParams.get('isTourist');
  
  // בדיקת תקינות פרמטרים
  const validParams = checkInStr && checkOutStr;
  
  // המרה לתאריכים, מספר אורחים וסטטוס תייר
  const checkIn = validParams ? parseISO(checkInStr) : null;
  const checkOut = validParams ? parseISO(checkOutStr) : null;
  const guests = parseInt(guestsStr, 10) || 2;
  const isTourist = isTouristStr === 'true';
  
  // חישוב מספר לילות - עדיפות לפרמטר מה-URL, אחרת חישוב מהתאריכים
  const nightsFromUrl = parseInt(nightsStr, 10);
  const nightsFromDates = validParams ? differenceInDays(checkOut, checkIn) : 0;
  const nightsCount = nightsFromUrl && nightsFromUrl > 0 ? nightsFromUrl : nightsFromDates;

  // חישוב תאריך ביטול (3 ימים לפני צ'ק-אין)
  const cancellationDate = checkIn ? subDays(checkIn, 3) : null;
  const formattedCancellationDate = cancellationDate ? format(cancellationDate, 'EEEE, d בMMMM yyyy', { locale: he }) : '';

  // פתיחת דיאלוג מדיניות
  const handleOpenPolicyDialog = (room) => {
    setSelectedRoom(room);
    setPolicyDialogOpen(true);
  };

  // סגירת דיאלוג מדיניות
  const handleClosePolicyDialog = () => {
    setPolicyDialogOpen(false);
    setSelectedRoom(null);
  };

  // ניווט תמונות
  const handlePrevImage = (roomId, totalImages) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [roomId]: prev[roomId] > 0 ? prev[roomId] - 1 : totalImages - 1
    }));
  };

  const handleNextImage = (roomId, totalImages) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || 0) < totalImages - 1 ? (prev[roomId] || 0) + 1 : 0
    }));
  };
  
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
        
        // סינון רק חדרים זמינים ומתאימים למספר האורחים
        const available = roomsResponse.data.filter((room, index) => 
          availabilityResults[index].data.available && 
          room.maxOccupancy >= guests
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
  }, [checkInStr, checkOutStr, guests, nightsCount, navigate, validParams]);
  
  // פורמט תאריכים לתצוגה
  const formattedCheckIn = validParams ? format(checkIn, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  const formattedCheckOut = validParams ? format(checkOut, 'EEEE, d בMMMM yyyy', { locale: he }) : '';
  
  // קרוסלת תמונות לחדר
  const renderRoomImageCarousel = (room) => {
    const roomImages = room.images && room.images.length > 0 ? room.images : [];
    const currentIndex = currentImageIndex[room._id] || 0;
    const hasMultipleImages = roomImages.length > 1;
    
    // אם יש תמונות
    if (roomImages.length > 0) {
      return (
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="200"
            image={roomImages[currentIndex]}
            alt={`${room.category} - תמונה ${currentIndex + 1}`}
            sx={{ 
              objectFit: 'cover',
              transition: 'transform 0.3s ease'
            }}
          />
          
          {/* מספר חדר קטן בפינה */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 500,
              zIndex: 3
            }}
          >
            {room.roomNumber}
          </Box>
          
          {/* אייקונים בפינה העליונה */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              p: 0.5,
              zIndex: 3
            }}
          >
            <WifiIcon sx={{ fontSize: 16, color: '#1976d2' }} />
            <AcUnitIcon sx={{ fontSize: 16, color: '#00bcd4' }} />
            <ParkingIcon sx={{ fontSize: 16, color: '#4caf50' }} />
          </Box>
          
          {/* חיצי ניווט - רק אם יש יותר מתמונה אחת */}
          {hasMultipleImages && (
            <>
              <IconButton
                onClick={() => handlePrevImage(room._id, roomImages.length)}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  width: 36,
                  height: 36,
                  zIndex: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              
              <IconButton
                onClick={() => handleNextImage(room._id, roomImages.length)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  width: 36,
                  height: 36,
                  zIndex: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          )}
          
          {/* אינדיקטורים - רק אם יש יותר מתמונה אחת */}
          {hasMultipleImages && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 0.5,
                zIndex: 2
              }}
            >
              {roomImages.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setCurrentImageIndex(prev => ({ ...prev, [room._id]: index }))}
                />
              ))}
            </Box>
          )}
        </Box>
      );
    }
    
    // אם אין תמונות, נציג תמונת דמה
    return (
      <Box sx={{ position: 'relative', height: 200 }}>
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
            {`חדר ${room.category}`}
          </Typography>
        </Box>
        
        {/* מספר חדר קטן בפינה */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.7rem',
            fontWeight: 500
          }}
        >
          {room.roomNumber}
        </Box>
        
        {/* אייקונים בפינה העליונה */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            p: 0.5
          }}
        >
          <WifiIcon sx={{ fontSize: 16, color: '#1976d2' }} />
          <AcUnitIcon sx={{ fontSize: 16, color: '#00bcd4' }} />
          <ParkingIcon sx={{ fontSize: 16, color: '#4caf50' }} />
        </Box>
      </Box>
    );
  };
  
  /**
   * חישוב מחיר עם אורחים נוספים וסטטוס תייר וימים מיוחדים
   * @param {Object} room - נתוני החדר
   * @param {number} guests - מספר אורחים
   * @param {number} nights - מספר לילות
   * @param {boolean} isTourist - האם תייר
   * @param {Date} checkIn - תאריך כניסה
   * @param {Date} checkOut - תאריך יציאה
   * @returns {Object} - אובייקט עם המחירים המחושבים
   */
  const calculateRoomPrice = (room, guests, nights, isTourist, checkIn = null, checkOut = null) => {
    if (!room) return { pricePerNight: 0, totalPrice: 0 };
    
    let totalPrice = 0;
    
    // אם יש תאריכי כניסה ויציאה, נחשב מחיר מדויק לכל יום
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      // מעבר על כל יום בתקופת השהייה
      for (let date = new Date(checkInDate); date < checkOutDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        let dailyBasePrice;
        
        if (dayOfWeek === 5) { // יום שישי
          dailyBasePrice = isTourist ? 
            (room.fridayPrice || room.basePrice || 0) : 
            (room.fridayVatPrice || room.vatPrice || 0);
        } else if (dayOfWeek === 6) { // יום שבת
          dailyBasePrice = isTourist ? 
            (room.saturdayPrice || room.basePrice || 0) : 
            (room.saturdayVatPrice || room.vatPrice || 0);
        } else { // שאר הימים
          dailyBasePrice = isTourist ? 
            (room.basePrice || 0) : 
            (room.vatPrice || 0);
        }
        
        // הוספת תוספת לאורחים נוספים
        const baseOccupancy = room.baseOccupancy || 2;
        const extraGuestCharge = room.extraGuestCharge || 0;
        const extraGuests = Math.max(0, guests - baseOccupancy);
        const extraCharge = extraGuests * extraGuestCharge;
        
        totalPrice += dailyBasePrice + extraCharge;
      }
      
      // חישוב מחיר ממוצע ללילה
      const avgPricePerNight = nights > 0 ? totalPrice / nights : 0;
      
      return {
        pricePerNight: parseFloat(avgPricePerNight.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        extraGuests: Math.max(0, guests - (room.baseOccupancy || 2)),
        extraCharge: Math.max(0, guests - (room.baseOccupancy || 2)) * (room.extraGuestCharge || 0)
      };
    } else {
      // חישוב פשוט ללא תאריכים מדויקים - משתמש במחיר בסיס
      const basePricePerNight = isTourist ? (room.basePrice || 0) : (room.vatPrice || 0);
      
      // חישוב תוספת לאורחים נוספים
      const baseOccupancy = room.baseOccupancy || 2;
      const extraGuestCharge = room.extraGuestCharge || 0;
      const extraGuests = Math.max(0, guests - baseOccupancy);
      const extraCharge = extraGuests * extraGuestCharge;
      
      // מחיר סופי ללילה
      const pricePerNight = basePricePerNight + extraCharge;
      
      // מחיר כולל
      const totalPrice = pricePerNight * nights;
      
      return {
        pricePerNight,
        totalPrice,
        extraGuests,
        extraCharge
      };
    }
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
            {isTourist && (
              <Chip 
                label="תייר - מחירים ללא מע״מ" 
                color="success" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
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
            אין חדרים זמינים בתאריכים שנבחרו עבור {guests} אורח{guests > 1 ? 'ים' : ''}. 
            אנא נסה תאריכים אחרים או מספר אורחים קטן יותר.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {availableRooms.map((room) => {
              const roomPricing = calculateRoomPrice(room, guests, nightsCount, isTourist, checkIn, checkOut);
              
              return (
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
                    {renderRoomImageCarousel(room)}
                    
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* תוכן עליון שיגדל */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" color="text.primary" paragraph sx={{ fontSize: { xs: '1rem', sm: '1.05rem' }, lineHeight: 1.6, fontWeight: 400 }}>
                          <strong>{room.category}</strong> - {room.description || 'חדר מאובזר ונוח למנוחה מושלמת. כולל מזגן, טלוויזיה ומקלחת פרטית.'}
                        </Typography>
                        
                        {roomPricing.extraGuests > 0 && (
                          <Typography variant="body2" sx={{ mb: 2, color: '#f57c00', fontWeight: 500 }}>
                            כולל {roomPricing.extraGuests} אורח{roomPricing.extraGuests > 1 ? 'ים' : ''} נוסף{roomPricing.extraGuests > 1 ? 'ים' : ''}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* תצוגת מחירים מקצועית - שורה אחת */}
                      <Box sx={{ 
                        bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                        borderRadius: 2, 
                        p: 2, 
                        border: '1px solid #cbd5e1',
                        mb: 1,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" color="text.secondary" sx={{ mr: 1, fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                              ₪{roomPricing.pricePerNight} × {nightsCount} לילות
                            </Typography>
                            <Tooltip title="פרטי התשלום והמדיניות" arrow>
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenPolicyDialog(room)}
                                sx={{ color: 'primary.main' }}
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight={700} color="success.main" sx={{ lineHeight: 1, fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
                              ₪{roomPricing.totalPrice}
                            </Typography>
                            {isTourist && (
                              <Typography variant="caption" color="success.main" sx={{ fontSize: '0.75rem' }}>
                                ללא מע״מ
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ p: 2, justifyContent: 'center' }}>
                      <Button 
                        variant="contained" 
                        component={Link}
                        to={`/airport-booking/book?roomId=${room._id}&checkIn=${checkInStr}&checkOut=${checkOutStr}&nights=${nightsCount}&guests=${guests}&isTourist=${isTourist}`}
                        sx={{ fontWeight: 500, width: '100%' }}
                        size="large"
                      >
                        הזמן עכשיו
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
        
        {/* דיאלוג מדיניות התשלום */}
        <Dialog 
          open={policyDialogOpen} 
          onClose={handleClosePolicyDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                פרטי התשלום והמדיניות
              </Typography>
              <IconButton onClick={handleClosePolicyDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="success.main" gutterBottom>
                💰 פרטי התשלום
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • אין תשלום נוסף - המחיר כולל את כל המיסים והעלויות
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • התשלום מתבצע במלונית בעת ההגעה (מזומן או כרטיס אשראי)
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="warning.main" gutterBottom>
                🔄 מדיניות ביטול
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • ניתן לבטל ללא עלות עד יום <strong>{formattedCancellationDate}</strong> בשעה 00:00
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • לאחר מועד זה לא ניתן לבטל את ההזמנה
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="info.main" gutterBottom>
                🕐 זמני צ'ק-אין וצ'ק-אאוט
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • <strong>צ'ק-אין:</strong> החל מהשעה 15:00
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>צ'ק-אאוט:</strong> עד השעה 10:00 בבוקר
              </Typography>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={handleClosePolicyDialog} 
              variant="contained" 
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              הבנתי
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PublicSiteLayout>
  );
};

export default SearchResultsPage; 