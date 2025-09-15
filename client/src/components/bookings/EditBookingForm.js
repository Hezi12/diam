import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
  InputAdornment,
  Switch,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import { addDays, differenceInDays } from 'date-fns';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  Hotel as HotelIcon,
  Receipt as ReceiptIcon,
  Comment as CommentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';

// רכיב של חישובי מחירים
import PriceCalculator from './PriceCalculator';

// סגנונות אחידים
import { formStyles, paymentStatusStyles } from '../../styles/ComponentStyles';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import { useFilter } from '../../contexts/FilterContext';

/**
 * טופס לעריכה ומחיקה של הזמנה קיימת
 */
const EditBookingForm = ({
  open,
  onClose,
  onSave,
  onDelete,
  booking,
  rooms,
  location
}) => {
  // הגדרת צבעים לפי מיקום
  const currentColors = STYLE_CONSTANTS.colors[location] || STYLE_CONSTANTS.colors.airport;
  const accentColors = STYLE_CONSTANTS.colors.accent;
  
  // שימוש בקונטקסט הסינון
  const { filterPaymentMethods, shouldHidePaymentMethod } = useFilter();

  // מצב טופס
  const [formData, setFormData] = useState({
    // פרטי אורח
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    
    // פרטי הזמנה
    room: '',
    checkIn: new Date(),
    checkOut: addDays(new Date(), 1),
    nights: 1,
    isTourist: false,
    guests: 2,
    
    // פרטי מחירים
    price: 0,
    pricePerNight: 0,
    pricePerNightNoVat: 0,
    
    // פרטי תשלום
    paymentStatus: 'unpaid',
    paymentAmount: 0,
    discount: 0,
    
    // סטטוס הזמנה ופרטים נוספים
    status: 'pending',
    notes: '',
    source: 'direct',
    externalBookingNumber: '',
    code: '',
    reviewHandled: false,
    manualInvoiceHandled: false,
    hasInvoiceReceipt: false,
    passportImageHandled: false,
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  // מצב שדות תיקוף
  const [errors, setErrors] = useState({});
  
  // הגדרת אמצעי התשלום הזמינים (מסוננים לפי הקונטקסט)
  const allPaymentMethods = [
    { value: 'unpaid', label: 'לא שולם' },
    { value: 'cash', label: 'מזומן' },
    { value: 'cash2', label: 'מזומן2' },
    { value: 'credit_or_yehuda', label: 'אשראי אור יהודה' },
    { value: 'credit_rothschild', label: 'אשראי רוטשילד' },
    { value: 'transfer_mizrahi', label: 'העברה מזרחי' },
    { value: 'bit_mizrahi', label: 'ביט מזרחי' },
    { value: 'paybox_mizrahi', label: 'פייבוקס מזרחי' },
    { value: 'transfer_poalim', label: 'העברה פועלים' },
    { value: 'bit_poalim', label: 'ביט פועלים' },
    { value: 'paybox_poalim', label: 'פייבוקס פועלים' },
    { value: 'delayed_transfer', label: 'העברה מאוחרת' },
    { value: 'other', label: 'אחר' }
  ];

  // סינון אמצעי התשלום בהתאם למצב הסינון
  const availablePaymentMethods = useMemo(() => {
    return filterPaymentMethods(allPaymentMethods);
  }, [filterPaymentMethods]);
  
  // מצבים נוספים
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // המצב של נעילת שדה מחיר לחישוב
  const [lockedField, setLockedField] = useState(null);

  // עדכון הטופס בעת טעינת ההזמנה
  useEffect(() => {
    if (booking) {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      setFormData({
        firstName: booking.firstName || '',
        lastName: booking.lastName || '',
        phone: booking.phone || '',
        email: booking.email || '',
        
        room: booking.room?._id || booking.room || '',
        checkIn,
        checkOut,
        nights: booking.nights || differenceInDays(checkOut, checkIn),
        isTourist: booking.isTourist || false,
        guests: booking.guests || 2,
        
        price: booking.price || 0,
        pricePerNight: booking.pricePerNight || 0,
        pricePerNightNoVat: booking.pricePerNightNoVat || 0,
        
        paymentStatus: booking.paymentStatus || 'unpaid',
        paymentAmount: booking.paymentAmount || 0,
        discount: booking.discount || 0,
        
        status: booking.status || 'pending',
        notes: booking.notes || '',
        source: booking.source || 'direct',
        externalBookingNumber: booking.externalBookingNumber || '',
        code: booking.code || '',
        reviewHandled: booking.reviewHandled || false,
        manualInvoiceHandled: booking.manualInvoiceHandled || false,
        hasInvoiceReceipt: booking.hasInvoiceReceipt || false,
        passportImageHandled: booking.passportImageHandled || false,
        creditCard: booking.creditCard || {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
        },
      });
    }
  }, [booking]);

  // טיפול בשינוי מצב הסינון - אם אמצעי התשלום הנוכחי מוסתר, נחליף אותו
  useEffect(() => {
    if (formData.paymentStatus && shouldHidePaymentMethod(formData.paymentStatus)) {
      setFormData(prev => ({
        ...prev,
        paymentStatus: 'unpaid'
      }));
    }
  }, [formData.paymentStatus, shouldHidePaymentMethod]);

  // טעינת מחיר ברירת המחדל של החדר בעת בחירת חדר
  useEffect(() => {
    if (formData.room) {
      const selectedRoom = rooms.find(room => room._id === formData.room);
      if (selectedRoom) {
        // רק אם לא מדובר בטעינה ראשונית של הזמנה קיימת (שיש לה כבר מחיר)
        if (!booking || formData.pricePerNight === 0) {
          // חישוב מחיר עם אורחים נוספים
          const priceCalculation = calculatePriceWithExtraGuests(
            selectedRoom, 
            formData.guests, 
            formData.isTourist, 
            formData.nights,
            formData.checkIn,
            formData.checkOut
          );
          
          setFormData(prev => ({
            ...prev,
            pricePerNight: priceCalculation.pricePerNight,
            pricePerNightNoVat: priceCalculation.pricePerNightNoVat,
            price: priceCalculation.totalPrice
          }));
        }
      }
    }
  }, [formData.room, formData.isTourist, formData.guests, rooms, booking]);

  // עדכון הלילות בעת שינוי תאריכים
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const nights = Math.max(1, differenceInDays(formData.checkOut, formData.checkIn));
      
      if (nights !== formData.nights) {
        // חישוב מחיר מחדש עם מספר הלילות החדש
        const selectedRoom = rooms.find(room => room._id === formData.room);
        if (selectedRoom) {
          const priceCalculation = calculatePriceWithExtraGuests(
            selectedRoom, 
            formData.guests, 
            formData.isTourist, 
            nights,
            formData.checkIn,
            formData.checkOut
          );
          
          setFormData(prev => ({
            ...prev,
            nights,
            pricePerNight: priceCalculation.pricePerNight,
            pricePerNightNoVat: priceCalculation.pricePerNightNoVat,
            price: priceCalculation.totalPrice
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            nights,
            price: prev.pricePerNight * nights
          }));
        }
      }
    }
  }, [formData.checkIn, formData.checkOut, formData.guests, formData.isTourist, rooms]);

  // טיפול בשינוי שדות כלליים
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // ניקוי שגיאות
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // טיפול בשינוי מספר לילות
  const handleNightsChange = (e) => {
    const nights = Math.max(1, parseInt(e.target.value) || 0);
    
    setFormData(prev => {
      // אם מספר הלילות משתנה, מעדכנים גם את תאריך הצ'ק-אאוט
      const newCheckOut = nights === prev.nights 
        ? prev.checkOut 
        : addDays(prev.checkIn, nights);
      
      // חישוב מחיר מחדש עם מספר הלילות החדש
      const selectedRoom = rooms.find(room => room._id === prev.room);
      if (selectedRoom) {
        const priceCalculation = calculatePriceWithExtraGuests(
          selectedRoom, 
          prev.guests, 
          prev.isTourist, 
          nights,
          prev.checkIn,
          newCheckOut
        );
        
        return {
          ...prev,
          nights,
          checkOut: newCheckOut,
          pricePerNight: priceCalculation.pricePerNight,
          pricePerNightNoVat: priceCalculation.pricePerNightNoVat,
          price: priceCalculation.totalPrice
        };
      } else {
        return {
          ...prev,
          nights,
          checkOut: newCheckOut,
          price: prev.pricePerNight * nights
        };
      }
    });
  };

  // טיפול בשינוי תאריך צ'ק-אין
  const handleCheckInChange = (date) => {
    setFormData(prev => {
      // חישוב תאריך צ'ק-אאוט חדש לפי מספר הלילות
      const newCheckOut = addDays(date, prev.nights);
      
      return {
        ...prev,
        checkIn: date,
        checkOut: newCheckOut
      };
    });
  };

  // טיפול בשינוי תאריך צ'ק-אאוט
  const handleCheckOutChange = (date) => {
    setFormData(prev => {
      // חישוב מספר לילות חדש
      const newNights = Math.max(1, differenceInDays(date, prev.checkIn));
      
      // חישוב מחיר מחדש עם מספר הלילות החדש
      const selectedRoom = rooms.find(room => room._id === prev.room);
      if (selectedRoom) {
        const priceCalculation = calculatePriceWithExtraGuests(
          selectedRoom, 
          prev.guests, 
          prev.isTourist, 
          newNights,
          prev.checkIn,
          date
        );
        
        return {
          ...prev,
          checkOut: date,
          nights: newNights,
          pricePerNight: priceCalculation.pricePerNight,
          pricePerNightNoVat: priceCalculation.pricePerNightNoVat,
          price: priceCalculation.totalPrice
        };
      } else {
        return {
          ...prev,
          checkOut: date,
          nights: newNights,
          price: prev.pricePerNight * newNights
        };
      }
    });
  };

  // טיפול בשינוי סכום ששולם
  const handlePaymentAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      paymentAmount: value
    }));
  };

  // טיפול בשינוי הנחה
  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      discount: value
    }));
  };

  // פתיחת WhatsApp עם המספר שהוזן
  const openWhatsApp = () => {
    if (formData.phone) {
      // בדיקה אם המספר מתחיל עם קידומת בינלאומית (+)
      const startsWithPlus = formData.phone.trim().startsWith('+');
      
      // מספר טלפון - להסיר מקפים, רווחים וכו'
      const phoneNumber = formData.phone.replace(/[\s-]/g, '');
      
      // עיבוד מספר הטלפון לפורמט בינלאומי תקין
      let processedNumber = phoneNumber.replace(/\D/g, '');
      
      // אם המספר מתחיל ב-0, נסיר אותו
      if (processedNumber.startsWith('0')) {
        processedNumber = processedNumber.substring(1);
      }
      
      // אם המספר התחיל עם + - הוא כבר בפורמט בינלאומי
      // רק אם המספר לא התחיל עם + וגם לא מתחיל ב-972, נוסיף קידומת ישראל
      if (!startsWithPlus && !processedNumber.startsWith('972')) {
        // בדיקה אם המספר מתחיל בקוד מדינה אחר (לפי אורך וספרה ראשונה)
        const startsWithCountryCode = /^[1-9][0-9]/.test(processedNumber) && processedNumber.length > 6;
        
        // נוסיף 972 רק אם זה מספר ישראלי (שלא מתחיל בקוד מדינה אחר)
        if (!startsWithCountryCode) {
          processedNumber = '972' + processedNumber;
        }
      }
      
      window.open(`https://wa.me/${processedNumber}`, '_blank');
    }
  };

  // תיקוף הטופס
  const validateForm = () => {
    const newErrors = {};
    
    // בדיקה שחדר נבחר
    if (!formData.room) {
      newErrors.room = 'יש לבחור חדר';
    }
    
    // בדיקה ששם מלא הוכנס
    if (!formData.firstName) {
      newErrors.firstName = 'יש להזין שם פרטי';
    }
    
    // בדיקת תאריכים
    if (!formData.checkIn) {
      newErrors.checkIn = 'יש לבחור תאריך צ׳ק-אין';
    }
    
    if (!formData.checkOut) {
      newErrors.checkOut = 'יש לבחור תאריך צ׳ק-אאוט';
    }
    
    // בדיקה שמחיר לא ריק
    if (formData.pricePerNight <= 0) {
      newErrors.pricePerNight = 'יש להזין מחיר תקין';
    }
    
    // בדיקת תקינות טלפון (ללא מספרים בלבד) אם הוזן
    if (formData.phone && !/^\+?\d+$/.test(formData.phone)) {
      newErrors.phone = 'יש להזין מספר טלפון תקין';
    }
    
    // בדיקת תקינות אימייל אם הוזן
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'יש להזין כתובת אימייל תקינה';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // טיפול בשמירת הטופס
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // טיפול בשם משפחה ריק
      const updatedFormData = {
        ...formData,
        lastName: formData.lastName || "-"
      };
      
      // פירוק תאריכי צ'ק-אין וצ'ק-אאוט ויצירת תאריכים ב-UTC ללא רכיב שעות
      const checkInOriginal = new Date(formData.checkIn);
      const checkOutOriginal = new Date(formData.checkOut);
      
      // יצירת תאריכים בפורמט UTC ללא שעות
      const checkInDate = new Date(Date.UTC(
        checkInOriginal.getFullYear(),
        checkInOriginal.getMonth(),
        checkInOriginal.getDate()
      ));
      
      const checkOutDate = new Date(Date.UTC(
        checkOutOriginal.getFullYear(),
        checkOutOriginal.getMonth(),
        checkOutOriginal.getDate()
      ));
      
      console.log('תאריכי הזמנה לעדכון:', {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString()
      });
      
      // קריאה לשרת לעדכון ההזמנה
      const response = await axios.put(`/api/bookings/${booking._id}`, {
        ...updatedFormData,
        location,
        room: formData.room,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        code: formData.code || '',
        reviewHandled: formData.reviewHandled || false,
        manualInvoiceHandled: formData.manualInvoiceHandled || false,
        passportImageHandled: formData.passportImageHandled || false
      });
      
      // סגירת הטופס
      onSave(response.data);
      
    } catch (err) {
      console.error('שגיאה בעדכון ההזמנה:', err);
      setError(err.response?.data?.message || 'שגיאה בעדכון ההזמנה');
      setLoading(false);
    }
  };

  // פתיחת אישור מחיקה
  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  // טיפול במחיקת הזמנה
  const handleDeleteBooking = async () => {
    setLoading(true);
    setError('');
    
    try {
      // קריאה לשרת למחיקת ההזמנה
      await axios.delete(`/api/bookings/${booking._id}`);
      
      // סגירת הטופס
      onDelete(booking._id);
      
    } catch (err) {
      console.error('שגיאה במחיקת ההזמנה:', err);
      setError(err.response?.data?.message || 'שגיאה במחיקת ההזמנה');
      setLoading(false);
    }
  };

  // הגדרה האם תשלום
  const isPaidStatus = [
    'cash', 'cash2', 'credit_or_yehuda', 'credit_rothschild', 'transfer_mizrahi', 
    'bit_mizrahi', 'paybox_mizrahi', 'transfer_poalim', 'bit_poalim', 
    'paybox_poalim', 'other'
  ].includes(formData.paymentStatus);

  /**
   * חישוב מחיר עם אורחים נוספים וימים מיוחדים (שישי ושבת)
   * @param {Object} roomData - נתוני החדר 
   * @param {number} guests - מספר אורחים
   * @param {boolean} isTourist - האם תייר
   * @param {number} nights - מספר לילות
   * @param {Date} checkIn - תאריך כניסה
   * @param {Date} checkOut - תאריך יציאה
   * @returns {Object} - אובייקט עם המחירים המחושבים
   */
  const calculatePriceWithExtraGuests = (roomData, guests, isTourist, nights, checkIn = null, checkOut = null) => {
    if (!roomData) return { pricePerNight: 0, pricePerNightNoVat: 0, totalPrice: 0 };
    
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
            (roomData.fridayPrice || roomData.basePrice || 0) : 
            (roomData.fridayVatPrice || roomData.vatPrice || 0);
        } else if (dayOfWeek === 6) { // יום שבת
          dailyBasePrice = isTourist ? 
            (roomData.saturdayPrice || roomData.basePrice || 0) : 
            (roomData.saturdayVatPrice || roomData.vatPrice || 0);
        } else { // שאר הימים
          dailyBasePrice = isTourist ? 
            (roomData.basePrice || 0) : 
            (roomData.vatPrice || 0);
        }
        
        // הוספת תוספת לאורחים נוספים
        const baseOccupancy = roomData.baseOccupancy || 2;
        const extraGuestCharge = roomData.extraGuestCharge || 0;
        const extraGuests = Math.max(0, guests - baseOccupancy);
        const extraCharge = extraGuests * extraGuestCharge;
        
        totalPrice += dailyBasePrice + extraCharge;
      }
      
      // חישוב מחיר ממוצע ללילה
      const avgPricePerNight = nights > 0 ? totalPrice / nights : 0;
      const avgPricePerNightNoVat = isTourist ? avgPricePerNight : (avgPricePerNight / 1.18);
      
      return {
        pricePerNight: parseFloat(avgPricePerNight.toFixed(2)),
        pricePerNightNoVat: parseFloat(avgPricePerNightNoVat.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        extraGuests: Math.max(0, guests - (roomData.baseOccupancy || 2)),
        extraCharge: Math.max(0, guests - (roomData.baseOccupancy || 2)) * (roomData.extraGuestCharge || 0)
      };
    } else {
      // חישוב פשוט ללא תאריכים מדויקים - משתמש במחיר בסיס
      const simpleBaseVatPrice = roomData.vatPrice || 0;
      const simpleBaseNoVatPrice = roomData.basePrice || 0;
      const simpleBasePricePerNight = isTourist ? simpleBaseNoVatPrice : simpleBaseVatPrice;
      
      // חישוב תוספת לאורחים נוספים
      const simpleBaseOccupancy = roomData.baseOccupancy || 2;
      const simpleExtraGuestCharge = roomData.extraGuestCharge || 0;
      const simpleExtraGuests = Math.max(0, guests - simpleBaseOccupancy);
      const simpleExtraCharge = simpleExtraGuests * simpleExtraGuestCharge;
      
      // מחיר סופי ללילה
      const simplePricePerNight = simpleBasePricePerNight + simpleExtraCharge;
      const simplePricePerNightNoVat = simpleBaseNoVatPrice + simpleExtraCharge;
      
      // מחיר כולל
      const simpleTotalPrice = parseFloat((simplePricePerNight * nights).toFixed(2));
      
      return {
        pricePerNight: simplePricePerNight,
        pricePerNightNoVat: simplePricePerNightNoVat,
        totalPrice: simpleTotalPrice,
        extraGuests: simpleExtraGuests,
        extraCharge: simpleExtraCharge
      };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...formStyles.dialog,
          maxHeight: 'calc(100vh - 40px)',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          ...formStyles.formHeader(location)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
            עריכת הזמנה {booking?.bookingNumber ? `${booking.bookingNumber}` : ''} - {location === 'airport' ? 'אור יהודה' : 'רוטשילד'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          {/* תג חשבונית - ניתן ללחיצה לסימון ידני */}
          <Tooltip title={(formData.hasInvoiceReceipt || formData.manualInvoiceHandled || formData.hasAnyInvoice) ? "יש חשבונית להזמנה זו - לחץ לביטול" : "לחץ לסימון חשבונית ידנית"}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: (formData.hasInvoiceReceipt || formData.manualInvoiceHandled || formData.hasAnyInvoice) ? 'rgba(6, 162, 113, 0.1)' : 'rgba(25, 118, 210, 0.08)',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: (formData.hasInvoiceReceipt || formData.manualInvoiceHandled || formData.hasAnyInvoice) ? 'rgba(6, 162, 113, 0.3)' : 'rgba(25, 118, 210, 0.2)',
              px: 1,
              py: 0.5
            }}>
              <Checkbox
                checked={(formData.hasInvoiceReceipt || formData.manualInvoiceHandled || formData.hasAnyInvoice) || false}
                onChange={(e) => setFormData({...formData, manualInvoiceHandled: e.target.checked})}
                size="small"
                sx={{
                  p: 0.5,
                  color: currentColors.main,
                  '&.Mui-checked': {
                    color: '#06a271',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.1rem'
                  }
                }}
              />
              <Typography sx={{ 
                fontSize: '0.8rem',
                fontWeight: 600,
                color: (formData.hasInvoiceReceipt || formData.manualInvoiceHandled || formData.hasAnyInvoice) ? '#06a271' : 'text.secondary',
                ml: 0.5,
                userSelect: 'none'
              }}>
                חשבונית
              </Typography>
            </Box>
          </Tooltip>

          {/* מעקב חוות דעת */}
          <Tooltip title="סמן כאשר טופל בחוות דעת">
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: formData.reviewHandled ? 'rgba(6, 162, 113, 0.1)' : 'rgba(0, 0, 0, 0.04)',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: formData.reviewHandled ? 'rgba(6, 162, 113, 0.3)' : 'rgba(0, 0, 0, 0.12)',
              px: 1,
              py: 0.5
            }}>
              <Checkbox
                checked={formData.reviewHandled || false}
                onChange={(e) => setFormData({...formData, reviewHandled: e.target.checked})}
                size="small"
                sx={{
                  p: 0.5,
                  color: currentColors.main,
                  '&.Mui-checked': {
                    color: '#06a271',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.1rem'
                  }
                }}
              />
              <Typography sx={{ 
                fontSize: '0.8rem',
                fontWeight: 600,
                color: formData.reviewHandled ? '#06a271' : 'text.secondary',
                ml: 0.5,
                userSelect: 'none'
              }}>
                חוות דעת
              </Typography>
            </Box>
          </Tooltip>


          {/* סטטוס תשלום */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>סטטוס תשלום</InputLabel>
            <Select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              label="סטטוס תשלום"
              size="small"
              sx={{
                fontSize: '0.85rem',
                bgcolor: 'white',
                borderRadius: '8px',
                '& .MuiSelect-select': {
                  py: 1,
                  pr: 2
                },
                ...(formData.paymentStatus === 'unpaid' ? paymentStatusStyles.unpaid : {}),
                ...(isPaidStatus ? paymentStatusStyles.paid : {})
              }}
            >
              {availablePaymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* כפתור מחיקה */}
          <Tooltip title="מחק הזמנה">
            <IconButton 
              onClick={handleDeleteClick}
              size="small"
              sx={{ 
                color: accentColors.red,
                bgcolor: 'rgba(227, 74, 111, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(227, 74, 111, 0.15)',
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          {/* כפתור סגירה */}
          <Tooltip title="סגור">
            <IconButton 
              onClick={onClose} 
              size="small" 
              sx={{ 
                color: accentColors.red,
                bgcolor: 'rgba(227, 74, 111, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(227, 74, 111, 0.15)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, mt: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
          {error && (
            <Box sx={{ mb: 2 }}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: '#ffebee', 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                color: accentColors.red
              }}>
                <Typography>{error}</Typography>
              </Paper>
            </Box>
          )}
          <Grid container spacing={3}>
            {/* חלק 1: פרטי אורח */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                boxShadow: STYLE_CONSTANTS.card.boxShadow,
                borderTop: `3px solid ${currentColors.main}`
              }}>
                <Box sx={formStyles.sectionTitle}>
                  <PersonIcon sx={{ color: currentColors.main, ...formStyles.formIcon }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי אורח
                  </Typography>
                </Box>
              
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="שם פרטי"
                      fullWidth
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      size="small"
                      name="firstName"
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="שם משפחה"
                      fullWidth
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      size="small"
                      name="lastName"
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="טלפון"
                      fullWidth
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      size="small"
                      name="phone"
                      error={!!errors.phone}
                      helperText={errors.phone}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon fontSize="small" sx={{ marginLeft: '8px' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton 
                              onClick={openWhatsApp}
                              disabled={!formData.phone} 
                              size="small"
                              sx={{ color: '#25D366' }}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="אימייל"
                      fullWidth
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      size="small"
                      name="email"
                      error={!!errors.email}
                      helperText={errors.email}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ marginLeft: '8px' }} /></InputAdornment>,
                      }}
                      sx={formStyles.textField}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 2: מחיר ותשלום */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                boxShadow: STYLE_CONSTANTS.card.boxShadow,
                borderTop: `3px solid ${accentColors.red}`
              }}>
                <Box sx={formStyles.sectionTitle}>
                  <ReceiptIcon sx={{ color: accentColors.red, ...formStyles.formIcon }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    מחיר ותשלום
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                    {/* צ'קבוקס תמונת פספורט - רק אם זה תייר */}
                    {formData.isTourist && (
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={formData.passportImageHandled || false} 
                            onChange={(e) => setFormData(prev => ({...prev, passportImageHandled: e.target.checked}))}
                            color="secondary"
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: accentColors.orange,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: accentColors.orange,
                              },
                            }}
                          />
                        }
                        label="תמונת דרכון טופלה"
                        labelPlacement="start"
                        sx={{ marginRight: 2, justifyContent: 'flex-end' }}
                      />
                    )}
                    
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={formData.isTourist}
                          onChange={(e) => setFormData({...formData, isTourist: e.target.checked})}
                          name="isTourist"
                          color="primary"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: accentColors.red,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: accentColors.red,
                            },
                          }}
                        />
                      }
                      label="תייר (ללא מע״מ)"
                      labelPlacement="start"
                      sx={{ marginRight: 0, justifyContent: 'flex-end' }}
                    />
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <PriceCalculator
                      formData={formData}
                      setFormData={setFormData}
                      lockedField={lockedField}
                      setLockedField={setLockedField}
                      isTourist={formData.isTourist}
                      nights={formData.nights}
                      checkInDate={formData.checkIn}
                      checkOutDate={formData.checkOut}
                      selectedRoom={rooms.find(room => room._id === formData.room)}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 3: פרטי הזמנה */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: STYLE_CONSTANTS.card.borderRadius,
                boxShadow: STYLE_CONSTANTS.card.boxShadow,
                borderTop: `3px solid ${accentColors.green}`
              }}>
                <Box sx={formStyles.sectionTitle}>
                  <HotelIcon sx={{ color: accentColors.green, ...formStyles.formIcon }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי הזמנה
                  </Typography>
                </Box>
              
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={1.7}>
                    <FormControl 
                      fullWidth 
                      error={!!errors.room} 
                      required 
                      size="small"
                      sx={formStyles.select}
                    >
                      <InputLabel>חדר</InputLabel>
                      <Select
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        label="חדר"
                      >
                        {rooms.map(room => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.roomNumber}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.room && <FormHelperText>{errors.room}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2.1}>
                    <DatePicker
                      label="כניסה"
                      value={formData.checkIn}
                      onChange={handleCheckInChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          size: "small",
                          error: !!errors.checkIn,
                          helperText: errors.checkIn,
                          sx: formStyles.textField
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2.1}>
                    <DatePicker
                      label="יציאה"
                      value={formData.checkOut}
                      onChange={handleCheckOutChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          size: "small",
                          error: !!errors.checkOut,
                          helperText: errors.checkOut,
                          sx: formStyles.textField
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={3} md={1.2}>
                    <TextField
                      label="לילות"
                      type="number"
                      fullWidth
                      value={formData.nights}
                      onChange={handleNightsChange}
                      InputProps={{
                        inputProps: { min: 1, style: { textAlign: 'center' } }
                      }}
                      size="small"
                      sx={formStyles.textField}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={3} md={1.2}>
                    <TextField
                      label="אורחים"
                      name="guests"
                      type="number"
                      fullWidth
                      value={formData.guests}
                      onChange={handleChange}
                      InputProps={{
                        inputProps: { min: 1, style: { textAlign: 'center' } }
                      }}
                      size="small"
                      sx={formStyles.textField}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={3} md={1.2}>
                    <TextField
                      name="code"
                      label="קוד"
                      fullWidth
                      value={formData.code}
                      onChange={handleChange}
                      inputProps={{ 
                        maxLength: 4, 
                        style: { textAlign: 'center' },
                        pattern: "[0-9]{4}"
                      }}
                      size="small"
                      sx={formStyles.textField}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={2.5}>
                    <FormControl 
                      fullWidth 
                      size="small"
                      sx={formStyles.select}
                    >
                      <InputLabel>מקור</InputLabel>
                      <Select
                        name="source"
                        value={formData.source || 'direct'}
                        onChange={handleChange}
                        label="מקור"
                      >
                        <MenuItem value="direct">ישיר</MenuItem>
                        <MenuItem value="home_website">אתר</MenuItem>
                        <MenuItem value="diam">Diam</MenuItem>
                        <MenuItem value="airport_stay">Airport</MenuItem>
                        <MenuItem value="rothschild_stay">Rothschild</MenuItem>
                        <MenuItem value="booking">Booking</MenuItem>
                        <MenuItem value="expedia">Expedia</MenuItem>
                        <MenuItem value="airbnb">Airbnb</MenuItem>
                        <MenuItem value="agoda">Agoda</MenuItem>
                        <MenuItem value="other">אחר</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* שדה מספר הזמנה חיצוני שיופיע רק כאשר המקור אינו ישיר או אתר הבית */}
                  {formData.source && formData.source !== 'direct' && formData.source !== 'home_website' && (
                    <Grid item xs={12} sm={6} md={3.5}>
                      <TextField
                        label="מספר הזמנה חיצוני"
                        name="externalBookingNumber"
                        fullWidth
                        value={formData.externalBookingNumber}
                        onChange={handleChange}
                        size="small"
                        sx={formStyles.textField}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ReceiptIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      label="הערות"
                      fullWidth
                      multiline
                      rows={4}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      name="notes"
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', marginTop: '16px' }}>
                            <CommentIcon fontSize="small" sx={{ marginLeft: '8px' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        ...formStyles.textField,
                        '& .MuiInputBase-multiline': {
                          paddingRight: '14px',
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions sx={formStyles.dialogActions}>
        <Button 
          onClick={onClose}
          color="inherit"
          sx={{ ...formStyles.button, color: '#666' }}
        >
          ביטול
        </Button>
        <Box>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ ...formStyles.button, bgcolor: currentColors.main }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'שומר...' : 'שמירת הזמנה'}
          </Button>
        </Box>
      </DialogActions>
      
      {/* דיאלוג אישור מחיקה */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>אישור מחיקת הזמנה</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את ההזמנה? פעולה זו לא ניתנת לביטול.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            ביטול
          </Button>
          <Button onClick={handleDeleteBooking} color="error" variant="contained">
            {loading ? <CircularProgress size={20} color="inherit" /> : 'מחיקה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default EditBookingForm; 