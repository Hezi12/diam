import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Stepper, 
    Step, 
  StepLabel,

  Alert,
  Card,
  CardMedia,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Payment as PaymentIcon,
  EventAvailable as EventAvailableIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import { parseISO, format, differenceInDays, addDays } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../../config/apiConfig';

import PublicSiteLayout from '../../components/public-site/PublicSiteLayout';
import { usePublicTranslation, usePublicLanguage } from '../../contexts/PublicLanguageContext';
import PriceCalculatorWithDiscounts from '../../components/pricing/PriceCalculatorWithDiscounts';

// שלבי הטופס - יעודכנו בתרגום
const steps = [];

const BookingFormPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const t = usePublicTranslation();
  const { currentLanguage } = usePublicLanguage();
  
  // בחירת locale לפי שפה נוכחית
  const dateLocale = currentLanguage === 'he' ? he : enUS;
  
  // שלבי הטופס מתורגמים
  const translatedSteps = [t('booking.step1'), t('booking.step2'), t('booking.step3')];
  
  // שלב נוכחי בטופס
  const [activeStep, setActiveStep] = useState(0);
  
  // מצב טעינה ושגיאות
  const [loading, setLoading] = useState(true);
  const [roomLoading, setRoomLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // נתוני החדר הנבחר
  const [room, setRoom] = useState(null);
  
  // נתוני ההזמנה
  const [bookingData, setBookingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    guests: 1,
    code: '',
    notes: '',
    paymentMethod: 'credit',
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      holderName: ''
    }
  });
  
  // מצב שגיאות הטופס
  const [formErrors, setFormErrors] = useState({});
  
  // מצב טריגר וולידציה - רק אחרי ניסיון שליחה
  const [touchedFields, setTouchedFields] = useState({});
  const [validationAttempted, setValidationAttempted] = useState(false);
  
  // מצב זמינות החדר
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isRoomAvailable, setIsRoomAvailable] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // חילוץ פרמטרים מה-URL
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('roomId');
  const checkInStr = searchParams.get('checkIn');
  const checkOutStr = searchParams.get('checkOut');
  const nightsStr = searchParams.get('nights');
  const guestsStr = searchParams.get('guests');
  const isTouristStr = searchParams.get('isTourist');
  const couponCodeStr = searchParams.get('couponCode');
  
  // בדיקת תקינות פרמטרים
  const validParams = roomId && checkInStr && checkOutStr;
  
  // המרה לתאריכים, מספר אורחים וסטטוס תייר
  const checkIn = validParams ? parseISO(checkInStr) : null;
  const checkOut = validParams ? parseISO(checkOutStr) : null;
  const urlGuests = parseInt(guestsStr, 10) || 2;
  const isTourist = isTouristStr === 'true';
  const couponCode = couponCodeStr || '';
  
  // חישוב מספר לילות - עדיפות לפרמטר מה-URL, אחרת חישוב מהתאריכים
  const nightsFromUrl = parseInt(nightsStr, 10);
  const nightsFromDates = validParams ? differenceInDays(checkOut, checkIn) : 0;
  const nightsCount = nightsFromUrl && nightsFromUrl > 0 ? nightsFromUrl : nightsFromDates;
  
  // חישוב תאריך ביטול (3 ימים לפני צ'ק-אין)
  const cancellationDate = checkIn ? new Date(checkIn.getTime() - 3 * 24 * 60 * 60 * 1000) : null;
  
  // תאריכים מפורמטים עם useMemo - פתרון לולאה אינסופית
  const formattedCheckIn = useMemo(() => {
    return validParams ? format(checkIn, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  }, [checkIn, validParams, dateLocale]);
  
  const formattedCheckOut = useMemo(() => {
    return validParams ? format(checkOut, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  }, [checkOut, validParams, dateLocale]);
  
  const formattedCancellationDate = useMemo(() => {
    return cancellationDate ? format(cancellationDate, 'EEEE, d MMMM yyyy', { locale: dateLocale }) : '';
  }, [cancellationDate, dateLocale]);
  
  // הורדה: הפונקציה calculateRoomPrice הישנה הוסרה - עכשיו משתמשים רק ב-PriceCalculatorWithDiscounts
  
  // מצב עבור מחיר מחושב עם הנחות
  const [pricingWithDiscounts, setPricingWithDiscounts] = useState({
    pricePerNight: 0,
    totalPrice: 0,
    originalPrice: 0,
    discountAmount: 0,
    appliedDiscounts: []
  });
  
  // עדכון הפונקציה submitBooking עם בדיקת זמינות
  const submitBooking = async () => {
    setLoading(true);
    
    // בדיקת זמינות לפני שליחת הטופס
    const isAvailable = await checkRoomAvailabilityBeforeSubmit();
    if (!isAvailable) {
      setLoading(false);
      return;
    }
    
    try {
      // יצירת אובייקט ההזמנה
      const bookingPayload = {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone,
        guests: parseInt(bookingData.guests, 10),
        code: bookingData.code || '',
        notes: bookingData.notes,
        room: roomId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        isTourist: isTourist,
        language: currentLanguage, // 🔥 הוספת שפת הלקוח
        creditCard: {
          cardNumber: bookingData.creditCard.cardNumber.replace(/\s/g, ''),
          expiryDate: bookingData.creditCard.expiryDate,
          cvv: bookingData.creditCard.cvv
        },
        // 🆕 הוספת נתוני הנחות ממערכת PriceCalculatorWithDiscounts
        finalPrice: pricingWithDiscounts.finalPrice || pricingWithDiscounts.totalPrice,
        originalPrice: pricingWithDiscounts.originalPrice,
        appliedDiscounts: pricingWithDiscounts.appliedDiscounts || [],
        discountAmount: pricingWithDiscounts.discountAmount || 0
      };
      
      console.log('שולח בקשת הזמנה עם הנתונים:', {
        firstName: bookingPayload.firstName,
        lastName: bookingPayload.lastName,
        email: bookingPayload.email,
        room: bookingPayload.room,
        checkIn: bookingPayload.checkIn,
        checkOut: bookingPayload.checkOut,
        guests: bookingPayload.guests,
        hasCreditCard: bookingPayload.creditCard ? 'כן' : 'לא',
        // 🆕 הוספת נתוני הנחות ללוגינג
        originalPrice: bookingPayload.originalPrice,
        finalPrice: bookingPayload.finalPrice,
        discountAmount: bookingPayload.discountAmount,
        hasDiscounts: bookingPayload.appliedDiscounts.length > 0
      });
      
      // שליחת ההזמנה לשרת דרך ה-API הציבורי
      const response = await axios.post(`${API_URL}/api/bookings/public/create`, bookingPayload);
      
      console.log('התקבלה תשובה מהשרת:', response.data);
      
      // מעבר לדף אישור
      navigate('/airport-booking/confirmation', {
        state: {
                    bookingData: {
            bookingNumber: response.data.data.bookingNumber,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            roomCategory: room.category || room.roomType || 'חדר רגיל',
            roomNumber: room.roomNumber,
            totalPrice: pricingWithDiscounts.finalPrice || pricingWithDiscounts.totalPrice,
            guests: bookingData.guests,
            nights: response.data.data.nights || nightsCount,
            price: response.data.data.price || pricingWithDiscounts.finalPrice || pricingWithDiscounts.totalPrice
          }
        }
      });
    } catch (err) {
      console.error('שגיאה ביצירת ההזמנה:', err);
      
      // הצגת שגיאה מפורטת יותר למשתמש
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.message || 'אירעה שגיאה לא ידועה';
        const errorDetails = err.response.data.error || '';
        
        console.error('פרטי שגיאה מהשרת:', {
          status: err.response.status,
          message: errorMsg,
          details: errorDetails
        });
        
        setError(`אירעה שגיאה ביצירת ההזמנה: ${errorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);
      } else {
        setError('אירעה שגיאה בתקשורת עם השרת. אנא נסה שנית.');
      }
      
      setLoading(false);
    }
  };
  
  // עדכון הפונקציה fetchRoom
  useEffect(() => {
    if (!validParams) {
      setError('פרמטרים חסרים בכתובת. אנא חזור לעמוד החיפוש ונסה שנית.');
      setLoading(false);
      return;
    }
    
    const fetchRoom = async () => {
      setRoomLoading(true);
      
      try {
        // בדיקת זמינות החדר דרך ה-API הציבורי
        const availabilityResponse = await axios.get(`${API_URL}/api/bookings/check-availability`, {
          params: {
            roomId,
            checkIn: checkInStr,
            checkOut: checkOutStr
          }
        });
        
        if (!availabilityResponse.data.available) {
          setError('החדר כבר לא זמין בתאריכים שנבחרו. אנא חזור לעמוד החיפוש ובחר חדר אחר.');
          setLoading(false);
          return;
        }
        
        // טעינת פרטי החדר דרך ה-API הציבורי
        const roomResponse = await axios.get(`${API_URL}${API_ENDPOINTS.rooms.public.byId(roomId)}`);
        setRoom(roomResponse.data);
        
        // עדכון מספר האורחים הראשוני רק אם צריך
        const newGuestCount = urlGuests || roomResponse.data.baseOccupancy || 1;
        setBookingData(prev => {
          // עדכן רק אם הערך באמת שונה כדי למנוע לולאה אינסופית
          if (prev.guests !== newGuestCount) {
            return {
              ...prev,
              guests: newGuestCount
            };
          }
          return prev;
        });
        
      } catch (err) {
        console.error('שגיאה בטעינת נתוני החדר:', err);
        setError('אירעה שגיאה בטעינת נתוני החדר. אנא נסה שנית.');
      } finally {
        setRoomLoading(false);
        setLoading(false);
      }
    };
    
    fetchRoom();
  }, [roomId, checkInStr, checkOutStr, nightsCount, validParams]);
  
  // הורדה: ה-useEffect לעדכון מחיר הוסר - PriceCalculatorWithDiscounts דואג לכל העדכונים
  
  // סיכום הזמנה מוכן מראש למניעת רי-רנדר מיותר
  const bookingSummary = useMemo(() => (
    <Card elevation={2} sx={{ borderRadius: '10px', position: { xs: 'static', md: 'sticky' }, top: 20 }}>
      {roomLoading ? (
        <Box sx={{ p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          {/* תמונת חדר */}
          {room?.images && room.images.length > 0 && room.images[0] ? (
            <CardMedia
              component="img"
              height="160"
              image={room.images[0]}
              alt={room?.category}
            />
          ) : (
            <Box
              sx={{
                height: 160,
                background: 'linear-gradient(135deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb 100%)',
                backgroundSize: '20px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}
            >
              <Typography variant="body2" sx={{ backgroundColor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1 }}>
                {room ? `${room.category}` : t('common.loading')}
              </Typography>
            </Box>
          )}
          
          <CardContent>
            <Typography variant="h6" component="h2" fontWeight={600} sx={{ fontSize: '1.1rem', mb: 2 }}>
              {room?.category}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventAvailableIcon sx={{ color: 'primary.main', mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '0.85rem' } }}>
                {formattedCheckIn} - {formattedCheckOut}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonOutlineIcon sx={{ color: 'primary.main', mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '0.85rem' } }}>
{t('common.upToGuests')} {room?.maxOccupancy} {t('common.guests')}
              </Typography>
            </Box>
            
            {isTourist && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ 
                  bgcolor: 'success.light', 
                  color: 'success.contrastText', 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1,
                  fontSize: '0.7rem'
                }}>
{t('common.touristPrices')}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ mb: 1.5 }} />
            
            {/* מחשבון מחירים עם הנחות - חישוב פעם אחת בלבד */}
            <PriceCalculatorWithDiscounts
              room={room}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={urlGuests}
              isTourist={isTourist}
              location="airport"
              couponCode={couponCode}
              nights={nightsCount}
              showDiscountBadges={true}
              compact={true}
              style={{ marginBottom: 16 }}
              onPriceCalculated={setPricingWithDiscounts}
            />

            <Divider sx={{ mb: 1.5 }} />

            {/* מדיניות התשלום - קומפקטית */}
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                <Typography component="span" sx={{ fontWeight: 600, color: 'success.main', fontSize: '0.9rem' }}>
{t('common.paymentDetails')}
                </Typography>
                {' '}
                <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                  {t('common.priceIncludes')}
                </Typography>
              </Typography>
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                <Typography component="span" sx={{ fontWeight: 600, color: 'warning.main', fontSize: '0.9rem' }}>
{t('common.cancellationPolicy')}
                </Typography>
                {' '}
                <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                  {t('common.cancellationPolicyShort')} {formattedCancellationDate} {t('common.cancellationAfter')}
                </Typography>
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <Typography component="span" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.9rem' }}>
{t('common.checkInOutTimes')}
                </Typography>
                {' '}
                <Typography component="span" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                  {t('common.checkInOutShort')}
                </Typography>
              </Typography>
            </Box>
          </CardContent>
        </>
      )}
    </Card>
  ), [room, checkIn, checkOut, nightsCount, isTourist, roomLoading, urlGuests, formattedCheckIn, formattedCheckOut, formattedCancellationDate, setPricingWithDiscounts]);
  
  // עדכון נתוני הטופס עם וולידציה בזמן אמת
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('creditCard.')) {
      const cardField = name.split('.')[1];
      const newCreditCard = {
        ...bookingData.creditCard,
        [cardField]: value
      };
      
      setBookingData({
        ...bookingData,
        creditCard: newCreditCard
      });
      
      // וולידציה בזמן אמת לכרטיס אשראי (רק אם המשתמש כבר ניסה לשלוח)
      if (validationAttempted && touchedFields[name]) {
        validateField(name, value, newCreditCard);
      }
    } else {
      setBookingData({
        ...bookingData,
        [name]: type === 'checkbox' ? checked : value
      });
      
      // וולידציה בזמן אמת (רק אם המשתמש כבר ניסה לשלוח)
      if (validationAttempted && touchedFields[name]) {
        validateField(name, type === 'checkbox' ? checked : value);
      }
    }
    
    // סימון שדה כנוגע
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };
  
  // וולידציה של שדה בודד
  const validateField = (name, value, creditCardData = null) => {
    const errors = { ...formErrors };
    
    if (name.startsWith('creditCard.')) {
      const cardField = name.split('.')[1];
      const cardData = creditCardData || bookingData.creditCard;
      
      if (cardField === 'cardNumber') {
        const cleanCard = (value || '').replace(/\s/g, '');
        if (!cleanCard) {
          errors[name] = 'מספר כרטיס הוא שדה חובה';
        } else if (!/^\d{16}$/.test(cleanCard)) {
          errors[name] = 'אנא הזן מספר כרטיס תקין (16 ספרות)';
        } else {
          delete errors[name];
        }
      } else if (cardField === 'expiryDate') {
        const cleanExpiry = (value || '').replace(/\s|-/g, '');
        if (!cleanExpiry) {
          errors[name] = 'תאריך תפוגה הוא שדה חובה';
        } else if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(cleanExpiry) && !/^\d{4}$/.test(cleanExpiry)) {
          errors[name] = 'אנא הזן תאריך תפוגה תקין (MMYY או MM/YY)';
        } else {
          delete errors[name];
        }
      } else if (cardField === 'cvv') {
        if (!value) {
          errors[name] = 'קוד אבטחה הוא שדה חובה';
        } else if (!/^\d{3,4}$/.test(value)) {
          errors[name] = 'אנא הזן קוד אבטחה תקין (3-4 ספרות)';
        } else {
          delete errors[name];
        }
      } else if (cardField === 'holderName') {
        if (!value || !value.trim()) {
          errors[name] = 'שם בעל הכרטיס הוא שדה חובה';
        } else {
          delete errors[name];
        }
      }
    } else {
      if (name === 'firstName') {
        if (!value || !value.trim()) {
          errors[name] = 'שם פרטי הוא שדה חובה';
        } else {
          delete errors[name];
        }
      } else if (name === 'lastName') {
        if (!value || !value.trim()) {
          errors[name] = 'שם משפחה הוא שדה חובה';
        } else {
          delete errors[name];
        }
      } else if (name === 'email') {
        if (!value || !value.trim()) {
          errors[name] = 'אימייל הוא שדה חובה';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errors[name] = 'אנא הזן כתובת אימייל תקינה';
        } else {
          delete errors[name];
        }
      } else if (name === 'phone') {
        const cleanPhone = (value || '').replace(/[^\d]/g, '');
        if (!cleanPhone) {
          errors[name] = 'מספר טלפון הוא שדה חובה';
        } else if (!/^\d{9,10}$/.test(cleanPhone)) {
          errors[name] = 'אנא הזן מספר טלפון תקין (9-10 ספרות)';
        } else {
          delete errors[name];
        }
      }
    }
    
    setFormErrors(errors);
  };
  
  // בדיקת זמינות החדר לפני שליחת הטופס
  const checkRoomAvailabilityBeforeSubmit = async () => {
    if (!roomId || !checkInStr || !checkOutStr) {
      return false;
    }
    
    setCheckingAvailability(true);
    
    try {
      const availabilityResponse = await axios.get(`${API_URL}/api/bookings/check-availability`, {
        params: {
          roomId,
          checkIn: checkInStr,
          checkOut: checkOutStr
        }
      });
      
      const available = availabilityResponse.data.available;
      setIsRoomAvailable(available);
      setAvailabilityChecked(true);
      
      if (!available) {
        setError('החדר כבר לא זמין בתאריכים שנבחרו. אנא חזור לעמוד החיפוש ובחר חדר אחר.');
      }
      
      return available;
    } catch (err) {
      console.error('שגיאה בבדיקת זמינות:', err);
      setError('אירעה שגיאה בבדיקת זמינות החדר. אנא נסה שנית.');
      setIsRoomAvailable(false);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };
  
  // אימות פרטי האורח - רק אחרי ניסיון שליחה
  const validateGuestDetails = () => {
    setValidationAttempted(true);
    
    // סימון כל השדות כנוגעים
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      phone: true
    });
    
    const errors = {};
    
    if (!bookingData.firstName || !bookingData.firstName.trim()) {
      errors.firstName = 'שם פרטי הוא שדה חובה';
    }
    
    if (!bookingData.lastName || !bookingData.lastName.trim()) {
      errors.lastName = 'שם משפחה הוא שדה חובה';
    }
    
    if (!bookingData.email || !bookingData.email.trim()) {
      errors.email = 'אימייל הוא שדה חובה';
    } else if (!/\S+@\S+\.\S+/.test(bookingData.email)) {
      errors.email = 'אנא הזן כתובת אימייל תקינה';
    }
    
    const cleanPhone = (bookingData.phone || '').replace(/[^\d]/g, '');
    if (!cleanPhone) {
      errors.phone = 'מספר טלפון הוא שדה חובה';
    } else if (!/^\d{9,10}$/.test(cleanPhone)) {
      errors.phone = 'אנא הזן מספר טלפון תקין (9-10 ספרות)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // אימות פרטי תשלום - רק אחרי ניסיון שליחה
  const validatePaymentDetails = () => {
    setValidationAttempted(true);
    
    // סימון כל שדות כרטיס האשראי כנוגעים
    setTouchedFields(prev => ({
      ...prev,
      'creditCard.cardNumber': true,
      'creditCard.expiryDate': true,
      'creditCard.cvv': true,
      'creditCard.holderName': true
    }));
    
    const errors = {};
    
    const cleanCardNumber = (bookingData.creditCard.cardNumber || '').replace(/\s/g, '');
    if (!cleanCardNumber) {
      errors['creditCard.cardNumber'] = 'מספר כרטיס הוא שדה חובה';
    } else if (!/^\d{16}$/.test(cleanCardNumber)) {
      errors['creditCard.cardNumber'] = 'אנא הזן מספר כרטיס תקין (16 ספרות)';
    }
    
    const cleanExpiryDate = (bookingData.creditCard.expiryDate || '').replace(/\s|-/g, '');
    if (!cleanExpiryDate) {
      errors['creditCard.expiryDate'] = 'תאריך תפוגה הוא שדה חובה';
    } else {
      const isValidFormat = /^(0[1-9]|1[0-2])\/?\d{2}$/.test(cleanExpiryDate) || // MM/YY או MMYY
                           /^(0[1-9]|1[0-2])\d{2}$/.test(cleanExpiryDate) || // MMYY
                           /^\d{4}$/.test(cleanExpiryDate); // MMYY
      
      if (!isValidFormat) {
        errors['creditCard.expiryDate'] = 'אנא הזן תאריך תפוגה תקין (MMYY או MM/YY)';
      }
    }
    
    if (!bookingData.creditCard.cvv || !bookingData.creditCard.cvv.trim()) {
      errors['creditCard.cvv'] = 'קוד אבטחה הוא שדה חובה';
    } else if (!/^\d{3,4}$/.test(bookingData.creditCard.cvv)) {
      errors['creditCard.cvv'] = 'אנא הזן קוד אבטחה תקין (3-4 ספרות)';
    }
    
    if (!bookingData.creditCard.holderName || !bookingData.creditCard.holderName.trim()) {
      errors['creditCard.holderName'] = 'שם בעל הכרטיס הוא שדה חובה';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // אימות אישור הזמנה
  const validateConfirmation = () => {
    const errors = {};
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // המשך לשלב הבא
  const handleNext = () => {
    let isValid = false;
    
    // אימות בהתאם לשלב הנוכחי
    switch (activeStep) {
      case 0:
        isValid = validateGuestDetails();
        break;
      case 1:
        isValid = validatePaymentDetails();
        break;
      case 2:
        isValid = validateConfirmation();
        if (isValid) {
          submitBooking();
          return;
        }
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // חזרה לשלב הקודם
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // תצוגת תוכן השלב הנוכחי
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              sx={{ 
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {t('booking.personalDetails')}
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label={t('booking.firstName')}
                  fullWidth
                  value={bookingData.firstName}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, firstName: true }));
                    if (validationAttempted) {
                      validateField('firstName', bookingData.firstName);
                    }
                  }}
                  error={validationAttempted && touchedFields.firstName && !!formErrors.firstName}
                  helperText={validationAttempted && touchedFields.firstName ? formErrors.firstName : ''}
                  required
                  size={isMobile ? "medium" : "small"}
                  placeholder={t('booking.firstNamePlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label={t('booking.lastName')}
                  fullWidth
                  value={bookingData.lastName}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, lastName: true }));
                    if (validationAttempted) {
                      validateField('lastName', bookingData.lastName);
                    }
                  }}
                  error={validationAttempted && touchedFields.lastName && !!formErrors.lastName}
                  helperText={validationAttempted && touchedFields.lastName ? formErrors.lastName : ''}
                  required
                  size={isMobile ? "medium" : "small"}
                  placeholder={t('booking.lastNamePlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label={t('booking.email')}
                  type="email"
                  fullWidth
                  value={bookingData.email}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, email: true }));
                    if (validationAttempted) {
                      validateField('email', bookingData.email);
                    }
                  }}
                  error={validationAttempted && touchedFields.email && !!formErrors.email}
                  helperText={validationAttempted && touchedFields.email ? formErrors.email : ''}
                  required
                  size={isMobile ? "medium" : "small"}
                  placeholder={t('booking.emailPlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label={t('booking.phone')}
                  fullWidth
                  value={bookingData.phone}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, phone: true }));
                    if (validationAttempted) {
                      validateField('phone', bookingData.phone);
                    }
                  }}
                  error={validationAttempted && touchedFields.phone && !!formErrors.phone}
                  helperText={validationAttempted && touchedFields.phone ? formErrors.phone : ''}
                  required
                  size={isMobile ? "medium" : "small"}
                  placeholder={t('booking.phonePlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="code"
                  label={`${t('booking.idNumber')} (${t('booking.optional')})`}
                  fullWidth
                  value={bookingData.code}
                  onChange={handleChange}
                  inputProps={{ 
                    maxLength: 4, 
                    style: { textAlign: 'center' },
                    pattern: "[0-9]{4}"
                  }}
                  placeholder="0000"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label={t('booking.notes')}
                  multiline
                  rows={2}
                  fullWidth
                  value={bookingData.notes}
                  onChange={handleChange}
                  size="small"
                  placeholder={t('booking.notesPlaceholder')}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              sx={{ 
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {t('booking.paymentDetails')}
            </Typography>
            
            <Alert severity="info" sx={{ 
              mb: { xs: 2, sm: 3 }, 
              borderRadius: '8px',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 500, 
                mb: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {t('booking.creditCard')}
              </Typography>
              <Typography variant="body2" sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {t('booking.paymentMethod')}
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="creditCard.cardNumber"
                  label={t('booking.creditCard')}
                  fullWidth
                  value={bookingData.creditCard.cardNumber}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, 'creditCard.cardNumber': true }));
                    if (validationAttempted) {
                      validateField('creditCard.cardNumber', bookingData.creditCard.cardNumber);
                    }
                  }}
                  error={validationAttempted && touchedFields['creditCard.cardNumber'] && !!formErrors['creditCard.cardNumber']}
                  helperText={validationAttempted && touchedFields['creditCard.cardNumber'] ? formErrors['creditCard.cardNumber'] : ''}
                  required
                  placeholder="#### #### #### ####"
                  inputProps={{ maxLength: 19, dir: "ltr", style: { textAlign: 'center' } }}
                  size={isMobile ? "medium" : "small"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="creditCard.expiryDate"
                  label={t('booking.expiryDate')}
                  fullWidth
                  value={bookingData.creditCard.expiryDate}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, 'creditCard.expiryDate': true }));
                    if (validationAttempted) {
                      validateField('creditCard.expiryDate', bookingData.creditCard.expiryDate);
                    }
                  }}
                  error={validationAttempted && touchedFields['creditCard.expiryDate'] && !!formErrors['creditCard.expiryDate']}
                  helperText={validationAttempted && touchedFields['creditCard.expiryDate'] ? formErrors['creditCard.expiryDate'] : ''}
                  required
                  placeholder="MM/YY"
                  inputProps={{ maxLength: 5, dir: "ltr", style: { textAlign: 'center' } }}
                  size={isMobile ? "medium" : "small"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="creditCard.cvv"
                  label="CVV"
                  fullWidth
                  value={bookingData.creditCard.cvv}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, 'creditCard.cvv': true }));
                    if (validationAttempted) {
                      validateField('creditCard.cvv', bookingData.creditCard.cvv);
                    }
                  }}
                  error={validationAttempted && touchedFields['creditCard.cvv'] && !!formErrors['creditCard.cvv']}
                  helperText={validationAttempted && touchedFields['creditCard.cvv'] ? formErrors['creditCard.cvv'] : ''}
                  required
                  placeholder="###"
                  inputProps={{ maxLength: 4, dir: "ltr", style: { textAlign: 'center' } }}
                  size={isMobile ? "medium" : "small"}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="creditCard.holderName"
                  label={t('booking.holderName')}
                  fullWidth
                  value={bookingData.creditCard.holderName}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouchedFields(prev => ({ ...prev, 'creditCard.holderName': true }));
                    if (validationAttempted) {
                      validateField('creditCard.holderName', bookingData.creditCard.holderName);
                    }
                  }}
                  error={validationAttempted && touchedFields['creditCard.holderName'] && !!formErrors['creditCard.holderName']}
                  helperText={validationAttempted && touchedFields['creditCard.holderName'] ? formErrors['creditCard.holderName'] : ''}
                  required
                  size={isMobile ? "medium" : "small"}
                  placeholder={t('booking.holderNamePlaceholder')}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              sx={{ 
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {t('booking.confirm')}
            </Typography>
            
            <Paper elevation={1} sx={{ 
              p: { xs: 2, sm: 3 }, 
              mb: { xs: 2, sm: 3 }, 
              borderRadius: '10px' 
            }}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                {t('booking.bookingDetails')}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('booking.firstName')} {t('booking.lastName')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bookingData.firstName} {bookingData.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.guests')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {bookingData.guests}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.checkIn')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formattedCheckIn}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.checkOut')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formattedCheckOut}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('booking.roomDetails')}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {room?.category}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('booking.totalPrice')}
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="primary.main">
                    {pricingWithDiscounts.finalPrice || pricingWithDiscounts.totalPrice || 0} ₪
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return t('common.unknownStep') || 'Unknown step';
    }
  };
  
  // נוסיף פונקציית עזר ליצירת תמונת דמה
  const renderRoomImage = () => {
    // בדיקה אם יש תמונה זמינה
    if (room?.images && room.images.length > 0 && room.images[0]) {
      return (
        <CardMedia
          component="img"
          height="160"
          image={room.images[0]}
          alt={room?.category}
        />
      );
    }
    
    // אם אין תמונה, נציג תמונת דמה
    return (
      <Box
        sx={{
          height: 160,
          background: 'linear-gradient(135deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb 100%)',
          backgroundSize: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280'
        }}
      >
        <Typography variant="body2" sx={{ backgroundColor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1 }}>
          {room ? `${room.category}` : t('common.loading')}
        </Typography>
      </Box>
    );
  };
  

  
  return (
    <PublicSiteLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        <Box sx={{ mb: { xs: 2, sm: 4 } }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: { xs: 2, sm: 3 }, 
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {t('booking.title')}
          </Typography>
          
          {error ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          ) : loading && !roomLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {/* טופס הזמנה */}
              <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
                <Paper elevation={1} sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  borderRadius: '10px',
                  '& .MuiTextField-root': {
                    mb: { xs: 1.5, sm: 1 }
                  }
                }}>
                  <Stepper 
                    activeStep={activeStep} 
                    alternativeLabel={!isMobile} 
                    orientation={isMobile ? 'vertical' : 'horizontal'}
                    sx={{
                      mb: 3,
                      '& .MuiStepConnector-root': {
                        display: isMobile ? 'none' : 'block'
                      },
                      '& .MuiStepLabel-root': {
                        '& .MuiStepLabel-label': {
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          fontWeight: 500
                        }
                      },
                      '& .MuiStepLabel-iconContainer': {
                        '& .MuiSvgIcon-root': {
                          fontSize: isMobile ? '1.5rem' : '1.75rem'
                        }
                      }
                    }}
                  >
                    {translatedSteps.map((label, index) => {
                      const stepProps = {
                        completed: index < activeStep,
                        active: index === activeStep
                      };
                      const labelProps = {
                        error: index < activeStep && Object.keys(formErrors).length > 0 && index === activeStep - 1
                      };
                      return (
                        <Step key={label} {...stepProps}>
                          <StepLabel {...labelProps}>{label}</StepLabel>
                        </Step>
                      );
                    })}
                  </Stepper>
                  
                  {getStepContent(activeStep)}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mt: 3,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  }}>
                    {activeStep === 0 ? (
                      <Button
                        component={Link}
                        to={`/airport-booking/search-results?checkIn=${checkInStr}&checkOut=${checkOutStr}&nights=${nightsCount}&guests=${urlGuests}&isTourist=${isTourist}`}
                        color="inherit"
                        sx={{ mr: { xs: 0, sm: 1 }, width: { xs: '100%', sm: 'auto' } }}
                        size={isMobile ? "medium" : "small"}
                        fullWidth={isMobile}
                      >
                        {t('common.backToResults')}
                      </Button>
                    ) : (
                      <Button
                        color="inherit"
                        onClick={handleBack}
                        sx={{ mr: { xs: 0, sm: 1 }, width: { xs: '100%', sm: 'auto' } }}
                        size={isMobile ? "medium" : "small"}
                        fullWidth={isMobile}
                      >
                        {t('common.back')}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading || checkingAvailability}
                      size={isMobile ? "medium" : "small"}
                      fullWidth={isMobile}
                      sx={isMobile ? { mt: 1 } : {}}
                    >
                      {checkingAvailability ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          {t('common.checkingAvailability') || 'בודק זמינות...'}
                        </>
                      ) : (
                        <>
                          {activeStep === translatedSteps.length - 1 ? t('common.finishBooking') : t('common.continue')}
                          {loading && activeStep === translatedSteps.length - 1 && (
                            <CircularProgress size={20} sx={{ ml: 1 }} />
                          )}
                        </>
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              
              {/* סיכום הזמנה - מוכן מראש ללא רי-רנדר מיותר */}
              <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
                {bookingSummary}
              </Grid>
            </Grid>
          )}
        </Box>
        

      </Container>
    </PublicSiteLayout>
  );
};

export default BookingFormPage; 