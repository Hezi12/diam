import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Bed as BedIcon,
  AcUnit as AcIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInDays, subDays, isValid } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';
import SearchBox from '../../components/public-site/SearchBox';
import PriceCalculatorWithDiscounts from '../../components/pricing/PriceCalculatorWithDiscounts';
import { usePublicTranslation, usePublicLanguage } from '../../contexts/PublicLanguageContext';
import SEOHead from '../../components/public-site/SEOHead';
import bookingService from '../../services/bookingService';
import DiscountService from '../../services/discountService';

const RothschildSearchResultsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const t = usePublicTranslation();
  const { currentLanguage } = usePublicLanguage();
  
  const [rooms, setRooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  
  // בחירת locale לפי שפה נוכחית
  const dateLocale = currentLanguage === 'he' ? he : enUS;
  
  // חילוץ פרמטרים מה-URL
  const searchParams = new URLSearchParams(location.search);
  const checkInStr = searchParams.get('checkIn');
  const checkOutStr = searchParams.get('checkOut');
  const nightsStr = searchParams.get('nights');
  const guestsStr = searchParams.get('guests');
  const isTouristStr = searchParams.get('isTourist');
  const couponCode = searchParams.get('couponCode');
  
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
  const formattedCancellationDate = cancellationDate ? format(cancellationDate, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';

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
      navigate('/rothschild-booking');
      return;
    }
    
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // קבלת כל החדרים מהמיקום הרלוונטי דרך ה-API הציבורי
        const roomsResponse = await axios.get(`${API_URL}${API_ENDPOINTS.rooms.public.byLocation('rothschild')}`);
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
        setError(t('rooms.loadingError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [checkInStr, checkOutStr, guests, nightsCount, navigate, validParams]);
  
  // פורמט תאריכים לתצוגה
  const formattedCheckIn = validParams ? format(checkIn, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  const formattedCheckOut = validParams ? format(checkOut, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  
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
            alt={`${room.category} - ${t('gallery.imageOf')} ${currentIndex + 1}`}
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
            {room.category}
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
  
  // פונקציה עזר לבחירת הנחות לחישוב מחיר
  const selectDiscountsForPricing = (discounts) => {
    const selectedIds = [];
    
    // בחירת הנחת קופון
    const couponDiscount = discounts.find(d => d.couponRequired);
    if (couponDiscount) {
      selectedIds.push(couponDiscount._id);
    }
    
    // בחירת הנחות רגילות שניתן לשלב
    const combinableRegularDiscounts = discounts.filter(d => 
      !d.couponRequired && d.combinable
    );
    
    if (combinableRegularDiscounts.length > 0) {
      selectedIds.push(combinableRegularDiscounts[0]._id);
    }
    
    // אם אין הנחות נבחרות, נבחר את הראשונה
    if (selectedIds.length === 0) {
      selectedIds.push(discounts[0]._id);
    }
    
    return selectedIds;
  };

  // קומפוננט להצגת מחיר עם הנחות
  const RoomPriceDisplay = ({ room, guests, nights, isTourist, checkIn, checkOut, couponCode }) => {
    const [priceData, setPriceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const calculatePrice = async () => {
        try {
          setLoading(true);
          
          // חישוב מחיר בסיס
          const basePrice = DiscountService.calculateBasePrice({
            room,
            checkIn,
            checkOut,
            nights,
            guests,
            isTourist
          });

          // חיפוש הנחות - עם תמיכה בקופון
          let discounts = [];
          if (couponCode) {
            // חיפוש הנחות עם קופון
            discounts = await DiscountService.getApplicableDiscountsWithCoupon({
              location: "rothschild",
              roomId: room._id,
              roomCategory: room.category,
              checkIn,
              checkOut,
              nights,
              guests,
              isTourist
            }, couponCode);
          } else {
            // חיפוש הנחות רגילות
            discounts = await DiscountService.getApplicableDiscounts({
              location: "rothschild",
              roomId: room._id,
              roomCategory: room.category,
              checkIn,
              checkOut,
              nights,
              guests,
              isTourist
            });
          }

          if (discounts.length > 0) {
            // בחירת הנחות לחישוב
            const selectedIds = selectDiscountsForPricing(discounts);
            
            // חישוב מחיר עם הנחות
            const priceWithDiscounts = await DiscountService.calculatePriceWithDiscounts({
              originalPrice: basePrice,
              location: "rothschild",
              roomId: room._id,
              roomCategory: room.category,
              checkIn,
              checkOut,
              nights,
              guests,
              isTourist,
              selectedDiscountIds: selectedIds
            }, couponCode);
            
            setPriceData(priceWithDiscounts);
          } else {
            setPriceData({
              originalPrice: basePrice,
              finalPrice: basePrice,
              savings: 0,
              totalDiscount: 0
            });
          }
        } catch (error) {
          console.error('שגיאה בחישוב מחיר:', error);
          // אם יש שגיאה, נחזיר מחיר בסיס
          const basePrice = DiscountService.calculateBasePrice({
            room,
            checkIn,
            checkOut,
            nights,
            guests,
            isTourist
          });
          
          setPriceData({
            originalPrice: basePrice,
            finalPrice: basePrice,
            savings: 0,
            totalDiscount: 0
          });
        } finally {
          setLoading(false);
        }
      };

      calculatePrice();
    }, [room._id, checkIn, checkOut, nights, guests, isTourist, couponCode]);

    if (loading) {
      return (
        <Box sx={{ 
          bgcolor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
          borderRadius: 2, 
          p: 2, 
          border: '1px solid #cbd5e1',
          mb: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              מחשב מחיר...
            </Typography>
            <Typography variant="h6" color="text.secondary">
              ₪...
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        bgcolor: priceData?.savings > 0 ? 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
        borderRadius: 2, 
        p: 2, 
        border: `1px solid ${priceData?.savings > 0 ? '#4caf50' : '#cbd5e1'}`,
        mb: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* תג הנחה אם יש */}
        {priceData?.savings > 0 && (
          <Box sx={{ mb: 1 }}>
            <Chip
              label={`חיסכון של ₪${priceData.savings}!`}
              color="success"
              size="small"
              variant="filled"
              sx={{ fontWeight: 600, fontSize: '0.8rem' }}
            />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {priceData?.savings > 0 ? (
              <Box>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.85rem' }}>
                  ₪{Math.round(priceData.originalPrice / nights)} × {nights} {t('common.nights')}
                </Typography>
                <Typography variant="body1" color="success.main" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                  ₪{Math.round(priceData.finalPrice / nights)} × {nights} {t('common.nights')}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ mr: 1, fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                ₪{Math.round(priceData?.finalPrice / nights)} × {nights} {t('common.nights')}
              </Typography>
            )}
            <Tooltip title={t('common.paymentPolicy')} arrow>
              <IconButton 
                size="small" 
                onClick={() => handleOpenPolicyDialog(room)}
                sx={{ color: 'primary.main', ml: 1 }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {priceData?.savings > 0 && (
              <Typography 
                variant="body2" 
                sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1 }}
              >
                ₪{priceData.originalPrice}
              </Typography>
            )}
            <Typography 
              variant="h6" 
              fontWeight={700} 
              color={priceData?.savings > 0 ? "success.main" : "success.main"} 
              sx={{ lineHeight: 1, fontSize: { xs: '1.3rem', sm: '1.5rem' } }}
            >
              ₪{priceData?.finalPrice || 0}
            </Typography>
            {isTourist && (
              <Typography variant="caption" color="success.main" sx={{ fontSize: '0.75rem' }}>
                {t('common.vatExempt')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    );
  };
  
  return (
    <PublicSiteLayout location="rothschild">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            to="/rothschild-booking"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2, gap: 1.5 }}
          >
{t('common.backToHome')}
          </Button>
          
          <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
            {t('rooms.searchResults')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body1">
{formattedCheckIn} - {formattedCheckOut} ({nightsCount} {t('common.nights')})
            </Typography>
            {isTourist && (
              <Chip 
                label={t('common.touristPrices')} 
                color="success" 
                size="small" 
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          
          <Paper elevation={1} sx={{ p: 2, mb: 4, borderRadius: '10px' }}>
            <SearchBox location="rothschild" />
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
            {t('common.noAvailableRooms')} 
            {t('common.tryDifferentDates')}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {availableRooms.map((room) => {
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
                          <strong>{room.category}</strong> - {t(`rooms.categoryDescriptions.${room.category}`) || t('rooms.categoryDescriptions.Standard')}
                        </Typography>
                        
                        {guests > (room.baseOccupancy || 2) && (
                          <Typography variant="body2" sx={{ mb: 2, color: '#f57c00', fontWeight: 500 }}>
                            {t('common.includes')} {guests - (room.baseOccupancy || 2)} {guests - (room.baseOccupancy || 2) > 1 ? t('common.extraGuests') : t('common.extraGuest')}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* תצוגת מחירים מקצועית עם הנחות */}
                      <RoomPriceDisplay room={room} guests={guests} nights={nightsCount} isTourist={isTourist} checkIn={checkIn} checkOut={checkOut} couponCode={couponCode} />
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ p: 2, justifyContent: 'center' }}>
                                            <Button 
                        variant="contained" 
                        component={Link}
                        to={`/rothschild-booking/book?roomId=${room._id}&checkIn=${checkInStr}&checkOut=${checkOutStr}&nights=${nightsCount}&guests=${guests}&isTourist=${isTourist}${couponCode ? `&couponCode=${couponCode}` : ''}`}
                        sx={{ fontWeight: 500, width: '100%' }}
                        size="large"
                      >
                        {t('rooms.book')}
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
                {t('common.paymentPolicy')}
              </Typography>
              <IconButton onClick={handleClosePolicyDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="success.main" gutterBottom>
                {t('common.paymentDetails')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('common.paymentInfo1')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('common.paymentInfo2')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} color="warning.main" gutterBottom>
                {t('common.cancellationPolicy')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • {t('common.cancellationInfo1')} <strong>{formattedCancellationDate}</strong> {t('common.cancellationInfo2')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • {t('common.cancellationInfo3')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="info.main" gutterBottom>
                {t('common.checkInOutTimes')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • <strong>{t('common.checkInTime')}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>{t('common.checkOutTime')}</strong>
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
{t('search.touristDialogButton')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PublicSiteLayout>
  );
};

export default RothschildSearchResultsPage; 