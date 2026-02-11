import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  MenuItem,
  Paper,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  CircularProgress,
  DialogContentText,
  Tooltip,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Person as PersonIcon,
  CreditCard as CreditCardIcon,
  Hotel as HotelIcon,
  Receipt as ReceiptIcon,
  Comment as CommentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import { addDays, differenceInDays } from 'date-fns';
import axios from 'axios';

import { STYLE_CONSTANTS } from '../../styles/StyleConstants';
import { useSnackbar } from 'notistack';
import { useFilter } from '../../contexts/FilterContext';

// רכיב של חישובי מחירים
import PriceCalculator from './PriceCalculator';

// רכיב דיאלוג סליקת אשראי וחשבוניות
import CreditCardChargeDialog from '../payment/CreditCardChargeDialog';



// פונקציה לסינון חדרים מקטגוריית "Not for Sale"
const filterNotForSaleRooms = (rooms) => {
  return rooms.filter(room => room.category !== 'Not for Sale');
};

// פונקציה למיון חדרים לפי מספר
const sortRoomsByNumber = (rooms) => {
  return [...rooms].sort((a, b) => {
    // המרת מספרי החדרים למספרים (אם הם מספריים)
    const roomNumberA = parseInt(a.roomNumber);
    const roomNumberB = parseInt(b.roomNumber);
    
    // אם שניהם מספרים תקינים, נמיין לפי ערך מספרי
    if (!isNaN(roomNumberA) && !isNaN(roomNumberB)) {
      return roomNumberA - roomNumberB;
    }
    
    // אחרת נמיין לפי מחרוזת
    return a.roomNumber.localeCompare(b.roomNumber);
  });
};

/**
 * טופס ליצירה/עריכה של הזמנה
 */
const NewBookingForm = ({
  open,
  onClose,
  onSave,
  rooms,
  location,
  editBooking = null, // אופציונלי - הזמנה לעריכה
  initialData = null, // אופציונלי - נתונים התחלתיים
  onDelete = null // פונקציה למחיקת הזמנה
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const { filterPaymentMethods, shouldHidePaymentMethod } = useFilter();
  const style = STYLE_CONSTANTS.style;
  const accentColors = STYLE_CONSTANTS.accentColors;
  const locationColors = STYLE_CONSTANTS.colors;
  const currentColors = locationColors[location] || locationColors.airport;

  // מיון החדרים לתצוגה (ללא סינון - כולל Not for Sale)
  const filteredAndSortedRooms = useMemo(() => {
    return sortRoomsByNumber(rooms);
  }, [rooms]);

  // האם אנחנו במצב עריכה
  const isEditMode = !!editBooking;

  // מצב לעקיבה אחר עריכת הזמנה קיימת
  const [isExistingBooking, setIsExistingBooking] = useState(false);
  
  // מצב קודם של הטופס עבור השוואות
  const prevFormState = useRef(null);

  // מצב חלונות ההזמנה
  const [newBookingOpen, setNewBookingOpen] = useState(false);

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

  // הגדרת מצב התחלתי של הטופס - משמש לאיפוס בעת פתיחת טופס חדש
  const initialFormData = {
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
    code: '',
    
    // פרטי מחירים - מאופסים ל-0 
    price: 0,
    pricePerNight: 0,
    pricePerNightNoVat: 0,
    
    // פרטי תשלום
    paymentStatus: 'unpaid',
    paymentAmount: 0,
    discount: 0,
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
    
    // פרטים נוספים
    source: 'direct',
    externalBookingNumber: '',
    notes: '',
    reviewHandled: false,
    passportImageHandled: false,
  };

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
    code: '',
    
    // פרטי מחירים
    price: 0,
    pricePerNight: 0,
    pricePerNightNoVat: 0,
    
    // פרטי תשלום
    paymentStatus: 'unpaid',
    paymentAmount: 0,
    discount: 0,
    creditCard: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
    
    // פרטים נוספים
    source: 'direct',
    externalBookingNumber: '',
    notes: '',
    reviewHandled: false,
    passportImageHandled: false,
  });

  // מצב שדות תיקוף
  const [errors, setErrors] = useState({});

  // המצב של נעילת שדה מחיר לחישוב
  const [lockedField, setLockedField] = useState(null);

  // המצב של שדות נעולים בטופס
  const [lockedFields, setLockedFields] = useState({});

  // המצב של שגיאות כלליות
  const [error, setError] = useState('');

  // מצב חלון אישור המחיקה
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // מצב חלון סליקת אשראי וחשבוניות
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  
  // מצב עבור בדיקה אם קיימת חשבונית להזמנה
  const [hasInvoice, setHasInvoice] = useState(false);

  // מצב תהליך שליחת הטופס
  const [isSubmitting, setIsSubmitting] = useState(false);

  // מצב תמונות מצורפות
  const [attachedImages, setAttachedImages] = useState([]);

  // מטווח תאריכים לבחירה
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: 'selection'
    }
  ]);

  // מצב לחישוב מחיר
  const [priceDetails, setPriceDetails] = useState({
    basePrice: 0,
    fridayPrice: 0,
    vatPrice: 0,
    extraGuestCharge: 0,
    isTourist: false,
    nights: 1,
    fridays: 0,
    guests: 2,
    baseOccupancy: 2
  });

  const [additionalRoomsLoading, setAdditionalRoomsLoading] = useState(false);

  // פונקציה אחידה לבדיקת קיום חשבונית (3 מקורות)
  const hasAnyInvoiceForBooking = (bookingData) => {
    if (!bookingData) return false;
    
    return !!(
      bookingData.hasInvoiceReceipt ||      // חשבונית אוטומטית מהמערכת
      bookingData.manualInvoiceHandled ||   // סימון ידני
      bookingData.hasAnyInvoice ||          // בדיקה בטבלת חשבוניות
      hasInvoice                            // בדיקה דינמית (fallback)
    );
  };

  // בדיקה דינמית אם קיימת חשבונית להזמנה (רק כ-fallback)
  const checkIfInvoiceExists = async (bookingId) => {
    if (!bookingId) return;
    
    try {
      // שליחת בקשה לשרת לבדוק אם קיימת חשבונית להזמנה
      const response = await axios.get(`/api/documents/check-booking/${bookingId}`);
      setHasInvoice(response.data.exists);
    } catch (error) {
      console.error('שגיאה בבדיקת קיום חשבונית:', error);
      setHasInvoice(false);
    }
  };

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

  // איפוס הטופס כאשר הדיאלוג נפתח
  useEffect(() => {
    if (open) {
      if (editBooking) {
        try {
          // מצב עריכה - מילוי הטופס בנתוני ההזמנה הקיימת
          const editFormData = {
            ...editBooking,
            // המרת רכיב חדר מאובייקט למזהה אם צריך
            room: typeof editBooking.room === 'object' && editBooking.room._id
              ? editBooking.room._id
              : editBooking.room,
            // המרת תאריכים לאובייקטי Date
            checkIn: new Date(editBooking.checkIn),
            checkOut: new Date(editBooking.checkOut),
            // וידוא שיש אובייקט creditCard
            creditCard: editBooking.creditCard || { cardNumber: '', expiryDate: '', cvv: '' },
            // וידוא שהשדות החדשים קיימים
            code: editBooking.code || '',
            reviewHandled: editBooking.reviewHandled || false,
            manualInvoiceHandled: editBooking.manualInvoiceHandled || false,
            hasInvoiceReceipt: editBooking.hasInvoiceReceipt || false,
            passportImageHandled: editBooking.passportImageHandled || false
          };
          
          console.log('טוען הזמנה לעריכה:', editFormData.firstName, 'עם פרטי אשראי:', 
                     editFormData.creditCard ? 'קיים' : 'חסר');
          
          // סימון שמדובר בהזמנה קיימת
          setIsExistingBooking(true);
          
          setFormData(editFormData);

          // טעינת התמונות המצורפות
          if (editBooking.attachedImages) {
            setAttachedImages(editBooking.attachedImages);
          }

          // בדיקה אם קיימת חשבונית להזמנה
          checkIfInvoiceExists(editBooking._id);

          // נעילת שדות אם ההזמנה במצב "הושלמה"
          if (editBooking.status === 'completed') {
            setLockedFields({
              room: true,
              checkIn: true,
              checkOut: true,
              isTourist: true,
            });
          } else {
            setLockedFields({});
          }
        } catch (error) {
          console.error('שגיאה בטעינת נתוני עריכה:', error);
          setError('שגיאה בטעינת פרטי ההזמנה לעריכה');
        }
      } else if (initialData) {
        // איפוס הדגל - זו לא הזמנה קיימת
        setIsExistingBooking(false);
        
        // יש לנו נתונים התחלתיים (למשל מלחיצה על תא בלוח השנה)
        const defaultData = {
          // פרטי אורח
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          
          // פרטי הזמנה
          room: initialData.room || '',
          checkIn: initialData.checkIn || new Date(),
          checkOut: initialData.checkOut || addDays(new Date(), 1),
          nights: initialData.nights || Math.max(1, differenceInDays(initialData.checkOut || addDays(new Date(), 1), initialData.checkIn || new Date())),
          isTourist: false,
          guests: 2,
          code: '',
          
          // פרטי מחירים
          price: 0,
          pricePerNight: 0,
          pricePerNightNoVat: 0,
          
          // פרטי תשלום
          paymentStatus: 'unpaid',
          paymentAmount: 0,
          discount: 0,
          creditCard: {
            cardNumber: '',
            expiryDate: '',
            cvv: '',
          },
          
          // סטטוס הזמנה ופרטים נוספים
          source: 'direct',
          status: 'pending',
          notes: '',
          reviewHandled: false,
        };
        
        setFormData(defaultData);
        setLockedFields({});
        
        // אם יש חדר בנתונים ההתחלתיים, נטען את פרטי המחיר שלו
        if (initialData.room) {
          const roomFromProps = rooms.find(room => room._id === initialData.room);
          if (roomFromProps) {
            const price = defaultData.isTourist ? roomFromProps.basePrice : roomFromProps.vatPrice;
            setFormData(prev => ({
              ...prev,
              pricePerNight: price,
              pricePerNightNoVat: roomFromProps.basePrice,
              price: price * prev.nights
            }));
          }
        }
      } else {
        // איפוס הדגל - זו לא הזמנה קיימת
        setIsExistingBooking(false);
        
        // מצב הזמנה חדשה - איפוס מלא של הטופס לערכי ברירת מחדל
        setFormData({
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
          code: '',
          
          // פרטי מחירים
          price: 0,
          pricePerNight: 0,
          pricePerNightNoVat: 0,
          
          // פרטי תשלום
          paymentStatus: 'unpaid',
          paymentAmount: 0,
          discount: 0,
          creditCard: {
            cardNumber: '',
            expiryDate: '',
            cvv: '',
          },
          
          // סטטוס הזמנה ופרטים נוספים
          source: 'direct',
          status: 'pending',
          notes: '',
          reviewHandled: false,
        });
        setLockedFields({});
      }
      
      setErrors({});
      setLockedField(null);
      setError('');
    }
  }, [open, editBooking, initialData, rooms]);

  // טיפול בשינוי מצב הסינון - אם אמצעי התשלום הנוכחי מוסתר, נחליף אותו
  useEffect(() => {
    if (formData.paymentStatus && shouldHidePaymentMethod(formData.paymentStatus)) {
      setFormData(prev => ({
        ...prev,
        paymentStatus: 'unpaid'
      }));
    }
  }, [formData.paymentStatus, shouldHidePaymentMethod]);

  /**
   * טעינת הגדרות החדר והמחירים
   * @param {string} roomId - מזהה החדר
   * @returns {Promise<void>}
   */
  const fetchRoomData = async (roomId) => {
    if (!roomId) return;
    
    try {
      // בדיקה אם roomId הוא אובייקט, במקרה כזה נקח את ה-_id שלו
      const actualRoomId = typeof roomId === 'object' && roomId._id ? roomId._id : roomId;
      
      // ננסה קודם למצוא את החדר במערך החדרים המקומי
      const roomFromProps = rooms.find(room => room._id === actualRoomId);
      
      if (roomFromProps) {
        // חישוב מחירים עם אורחים נוספים וימים מיוחדים
        const priceCalculation = calculatePriceWithExtraGuests(
          roomFromProps, 
          formData.guests, 
          formData.isTourist, 
          formData.nights,
          formData.checkIn,
          formData.checkOut
        );
        
        // עדכון הטופס
        setFormData(prev => ({
          ...prev,
          room: actualRoomId,
          pricePerNight: priceCalculation.pricePerNight,
          pricePerNightNoVat: priceCalculation.pricePerNightNoVat,
          price: priceCalculation.totalPrice
        }));
        
        // עדכון פרטי המחיר לחישובים עתידיים
        setPriceDetails(prev => ({
          ...prev,
          basePrice: roomFromProps.basePrice,
          fridayPrice: roomFromProps.fridayPrice || roomFromProps.basePrice,
          saturdayPrice: roomFromProps.saturdayPrice || roomFromProps.basePrice,
          vatPrice: roomFromProps.vatPrice,
          extraGuestCharge: roomFromProps.extraGuestCharge || 0,
          baseOccupancy: roomFromProps.baseOccupancy || 2,
          guests: formData.guests,
          nights: formData.nights,
          isTourist: formData.isTourist
        }));
        
        return;
      }
      
      // אם לא מצאנו בפרופס, ננסה לקבל מהשרת
      const response = await axios.get(`/api/rooms/id/${actualRoomId}`);
      const roomData = response.data;
      
      if (roomData) {
        // חישוב מחירים עם אורחים נוספים
        const priceCalculation = calculatePriceWithExtraGuests(
          roomData, 
          formData.guests, 
          formData.isTourist, 
          formData.nights
        );
        
        // עדכון הטופס
        setFormData(prev => ({
          ...prev,
          room: actualRoomId,
          pricePerNight: priceCalculation.pricePerNight,
          pricePerNightNoVat: priceCalculation.pricePerNightNoVat,
          price: priceCalculation.totalPrice
        }));
        
        // עדכון פרטי המחיר לחישובים עתידיים
        setPriceDetails(prev => ({
          ...prev,
          basePrice: roomData.basePrice,
          fridayPrice: roomData.fridayPrice || roomData.basePrice,
          saturdayPrice: roomData.saturdayPrice || roomData.basePrice,
          vatPrice: roomData.vatPrice,
          extraGuestCharge: roomData.extraGuestCharge || 0,
          baseOccupancy: roomData.baseOccupancy || 2,
          guests: formData.guests,
          nights: formData.nights,
          isTourist: formData.isTourist
        }));
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי החדר:', error);
      setError('שגיאה בטעינת פרטי החדר. נסה שנית מאוחר יותר.');
    }
  };

  // עדכון המחיר לפי בחירת החדר (רק להזמנות חדשות)
  useEffect(() => {
    if (formData.room && !isExistingBooking) {
      console.log('🔄 מחשב מחיר חדש לחדר:', formData.room);
      
      // איפוס המחיר הנוכחי לפני עדכון המחיר החדש
      setFormData(prev => ({
        ...prev,
        pricePerNight: 0,
        pricePerNightNoVat: 0,
        price: 0
      }));
      
      // טעינת המחיר מהחדר הנבחר
      fetchRoomData(formData.room);
    } else if (formData.room && isExistingBooking) {
      console.log('💰 שמירה על המחיר הקיים להזמנה בעריכה:', formData.price);
    }
  }, [formData.room, formData.isTourist, isExistingBooking]);
  
  // עדכון המחיר הכולל כאשר מספר הלילות או האורחים משתנה (רק להזמנות חדשות)
  useEffect(() => {
    if (formData.room && formData.pricePerNight && formData.nights && !isExistingBooking) {
      console.log('🔄 מחשב מחיר מחדש בגלל שינוי בלילות/אורחים');
      
      // מציאת החדר הנבחר
      const selectedRoom = rooms.find(room => room._id === formData.room);
      
      if (selectedRoom) {
        // חישוב מחיר מחדש עם מספר האורחים הנוכחי
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
      } else {
        // אם לא מצאנו את החדר, נשתמש במחיר הקיים
        const totalPrice = parseFloat((formData.pricePerNight * formData.nights).toFixed(2));
        setFormData(prev => ({
          ...prev,
          price: totalPrice
        }));
      }
    } else if (isExistingBooking) {
      console.log('💰 דילוג על חישוב מחיר מחדש - הזמנה בעריכה');
    }
  }, [formData.nights, formData.guests, formData.isTourist, rooms, isExistingBooking]);

  // חישוב מחיר והתאמות לפי תאריכים וחדר נבחר (רק להזמנות חדשות)
  useEffect(() => {
    // חישוב מספר לילות רק אם יש תאריכים תקינים
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      
      // איפוס השעות בשני התאריכים
      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);
      
      // שימוש בפונקציה המובנית differenceInDays שמחשבת את מספר הלילות
      const daysDiff = differenceInDays(checkOutDate, checkInDate);
      const nights = Math.max(1, daysDiff);
      
      // עדכון ערך הלילות בטופס רק אם מספר הלילות שונה
      if (nights !== formData.nights) {
        setFormData(prev => ({ 
          ...prev, 
          nights: nights 
        }));
        
        // אם יש חדר נבחר ולא במצב עריכה, עדכן את המחירים בהתאם להגדרות החדר
        if (formData.room && !isExistingBooking) {
          console.log('🔄 מחשב מחיר מחדש בגלל שינוי תאריכים');
          fetchRoomData(formData.room);
        } else if (isExistingBooking) {
          console.log('💰 דילוג על עדכון מחיר בגלל שינוי תאריכים - הזמנה בעריכה');
        }
      }
    }
  }, [formData.checkIn, formData.checkOut, formData.room, formData.isTourist, isExistingBooking]);

  // מעקב אחר שינויים בחדר הנבחר (רק להזמנות חדשות)
  useEffect(() => {
    // שמירת המצב הקודם לשימוש בהשוואה
    if (!prevFormState.current) {
      // מצב ראשוני - יצירת אובייקט מעקב
      prevFormState.current = {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        room: formData.room,
        isTourist: formData.isTourist,
        guests: formData.guests,
        hasRoomBeenChanged: false
      };
      
      // אם זו הזמנה חדשה ויש חדר, נטען את פרטי המחיר
      if (formData.room && !isExistingBooking) {
        fetchRoomData(formData.room);
      }
      return;
    }
    
    // אם הוחלף החדר, נטען את פרטי המחיר של החדר החדש (רק להזמנות חדשות)
    if (formData.room && prevFormState.current.room !== formData.room) {
      console.log('חדר השתנה:', prevFormState.current.room, '->', formData.room);
      
      if (isExistingBooking) {
        console.log('💰 דילוג על עדכון מחיר - הזמנה בעריכה משתמשת במחיר הקיים');
      } else {
        console.log('🔄 טעינת מחיר חדר חדש');
        fetchRoomData(formData.room);
      }
    }
    
    // עדכון המעקב אחר החדר
    prevFormState.current.room = formData.room;
    prevFormState.current.guests = formData.guests;
  }, [formData.room, formData.guests, isExistingBooking]);

  // מעקב אחר שינויים כשאחד מהשדות משתנה
  useEffect(() => {
    // לא נעשה כלום אם אין מצב קודם עדיין
    if (!prevFormState.current) {
      return;
    }
    
    // אם התאריכים או מספר האורחים השתנו, נעדכן את המחיר בהתאם
    const checkInChanged = formData.checkIn.getTime() !== prevFormState.current.checkIn.getTime();
    const checkOutChanged = formData.checkOut.getTime() !== prevFormState.current.checkOut.getTime();
    const isTouristChanged = formData.isTourist !== prevFormState.current.isTourist;
    const guestsChanged = formData.guests !== prevFormState.current.guests;
    
    if ((checkInChanged || checkOutChanged || isTouristChanged || guestsChanged) && !isExistingBooking && formData.room) {
      // חישוב מחיר מחדש עם הפרמטרים החדשים (רק להזמנות חדשות)
      console.log('🔄 עדכון מחיר בגלל שינוי פרמטרים - הזמנה חדשה');
      const selectedRoom = rooms.find(room => room._id === formData.room);
      if (selectedRoom) {
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
    } else if ((checkInChanged || checkOutChanged || isTouristChanged || guestsChanged) && isExistingBooking) {
      console.log('💰 דילוג על עדכון מחיר - הזמנה בעריכה משתמשת במחיר הקיים');
    }
    
    // עדכון המצב הקודם
    prevFormState.current.checkIn = formData.checkIn;
    prevFormState.current.checkOut = formData.checkOut;
    prevFormState.current.isTourist = formData.isTourist;
    prevFormState.current.guests = formData.guests;
  }, [formData.checkIn, formData.checkOut, formData.room, formData.isTourist, formData.guests, rooms, isExistingBooking]);

  // בדיקת תקינות הטופס
  const validateForm = () => {
    const newErrors = {};
    
    // בדיקת שדות חובה לפי המודל בשרת
    if (!formData.firstName) newErrors.firstName = 'יש למלא שם פרטי';
    if (!formData.room) newErrors.room = 'יש לבחור חדר';
    if (!formData.checkIn) newErrors.checkIn = 'יש לבחור תאריך צ\'ק-אין';
    if (!formData.checkOut) newErrors.checkOut = 'יש לבחור תאריך צ\'ק-אאוט';
    
    // בדיקת פורמט אימייל (אם הוזן)
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }
    
    // בדיקת תאריכים
    if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut) {
      newErrors.checkOut = 'תאריך צ\'ק-אאוט חייב להיות אחרי צ\'ק-אין';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // טיפול בשינוי שדה בטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // טיפול מיוחד עבור שדה room
    if (name === 'room') {
      // וידוא שערך room תמיד מאוחסן כ-ID ולא כאובייקט
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // טיפול בשינוי בפרטי תשלום
  const handlePaymentDetailChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      creditCard: {
        ...(prev.creditCard || {}),
        [name]: value
      }
    }));
  };

  // טיפול בשינוי תאריך צ'ק-אין
  const handleCheckInChange = (date) => {
    const newCheckIn = new Date(date);
    // איפוס השעה בתאריך
    newCheckIn.setHours(0, 0, 0, 0);
    
    // נבדוק אם יש צורך לעדכן גם את צ'ק-אאוט
    let newNights = formData.nights;
    let newCheckOut = formData.checkOut;
    
    if (newCheckIn >= formData.checkOut) {
      // אם תאריך הכניסה החדש אחרי או שווה לתאריך היציאה הקיים,
      // נגדיר תאריך יציאה חדש יום אחד אחרי הכניסה
      newCheckOut = addDays(newCheckIn, 1);
      newNights = 1;
    } else {
      // אחרת, נחשב מחדש את מספר הלילות
      const checkOutDate = new Date(formData.checkOut);
      checkOutDate.setHours(0, 0, 0, 0);
      
      // חישוב הפרש בימים
      const daysDiff = differenceInDays(checkOutDate, newCheckIn);
      
      // תמיד להחזיר לפחות 1 לילה
      newNights = Math.max(1, daysDiff);
    }
    
    // עדכון הטופס עם הערכים החדשים
    setFormData(prev => ({
      ...prev,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights: newNights,
      // עדכון מחיר רק אם זו לא הזמנה בעריכה
      price: isExistingBooking ? prev.price : parseFloat((prev.pricePerNight * newNights).toFixed(2))
    }));
  };

  // טיפול בשינוי תאריך צ'ק-אאוט
  const handleCheckOutChange = (date) => {
    const newCheckOut = new Date(date);
    // איפוס השעה בתאריך
    newCheckOut.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(formData.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    // חישוב הפרש הימים
    const daysDiff = differenceInDays(newCheckOut, checkInDate);
    
    // חייב להיות לפחות לילה אחד
    const newNights = Math.max(1, daysDiff);
    
    // אם הצ'ק-אאוט מוקדם או שווה לצ'ק-אין, נקבע צ'ק-אאוט יום אחד אחרי
    if (daysDiff <= 0) {
      const newDate = addDays(formData.checkIn, 1);
      
      setFormData(prev => ({
        ...prev,
        checkOut: newDate,
        nights: 1,
        // עדכון מחיר רק אם זו לא הזמנה בעריכה
        price: isExistingBooking ? prev.price : parseFloat((prev.pricePerNight).toFixed(2))
      }));
      
      return;
    }
    
    // עדכון הטופס עם הערכים החדשים
    setFormData(prev => ({
      ...prev,
      checkOut: newCheckOut,
      nights: newNights,
      // עדכון מחיר רק אם זו לא הזמנה בעריכה
      price: isExistingBooking ? prev.price : parseFloat((prev.pricePerNight * newNights).toFixed(2))
    }));
  };

  // טיפול בשינוי מספר לילות
  const handleNightsChange = (e) => {
    const nights = parseInt(e.target.value) || 0;
    
    if (nights <= 0) {
      setErrors(prev => ({ ...prev, nights: 'מספר לילות חייב להיות גדול מ-0' }));
      return;
    }
    
    // חישוב תאריך צ'ק-אאוט חדש לפי מספר הלילות
    const checkInDate = new Date(formData.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const newCheckOut = addDays(checkInDate, nights);
    
    setFormData(prev => ({
      ...prev,
      checkOut: newCheckOut,
      nights: nights,
      // עדכון מחיר רק אם זו לא הזמנה בעריכה
      price: isExistingBooking ? prev.price : parseFloat((prev.pricePerNight * nights).toFixed(2))
    }));
    
    setErrors(prev => ({ ...prev, nights: undefined }));
  };

  // טיפול בשינוי סטטוס תייר
  const handleTouristChange = (e) => {
    const isTourist = e.target.checked;
    
    // אם זו הזמנה בעריכה, רק נעדכן את הסטטוס ללא שינוי מחיר
    if (isExistingBooking) {
      console.log('💰 שמירה על המחיר הקיים בשינוי סטטוס תייר - הזמנה בעריכה');
      setFormData(prev => ({
        ...prev,
        isTourist
      }));
      return;
    }
    
    // אם זה תייר, המחיר הוא בלי מע״מ (רק להזמנות חדשות)
    setFormData(prev => {
      let pricePerNight;
      
      if (prev.room) {
        const selectedRoom = rooms.find(room => room._id === prev.room);
        pricePerNight = isTourist ? selectedRoom?.basePrice : selectedRoom?.vatPrice;
      } else {
        pricePerNight = isTourist ? prev.pricePerNightNoVat : 
          parseFloat((prev.pricePerNightNoVat * 1.18).toFixed(2));
      }
      
      return {
        ...prev,
        isTourist,
        pricePerNight: pricePerNight || prev.pricePerNight,
        price: parseFloat(((pricePerNight || prev.pricePerNight) * prev.nights).toFixed(2))
      };
    });
  };

  // פונקציה לעדכון התמונות לאחר שינוי
  const handleImagesUpdate = () => {
    if (editBooking && editBooking._id) {
      // טעינה מחדש של התמונות המעודכנות
      // בקשה מהשרת לקבלת הנתונים העדכניים של ההזמנה
      fetchUpdatedBookingImages(editBooking._id);
    }
  };

  // פונקציה לטעינת תמונות מעודכנות מהשרת
  const fetchUpdatedBookingImages = async (bookingId) => {
    try {
      const response = await axios.get(`/api/bookings/single/${bookingId}`);
      if (response.data && response.data.attachedImages) {
        setAttachedImages(response.data.attachedImages);
      } else {
        setAttachedImages([]);
      }
    } catch (error) {
      console.error('❌ שגיאה בטעינת תמונות מעודכנות:', error);
    }
  };

  // פונקציה להצגת הודעות
  const showNotification = (message, severity = 'success') => {
    enqueueSnackbar(message, { variant: severity });
  };

  // טיפול בשמירת הטופס
  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // שימוש במקף כשם משפחה אם לא הוזן
        const lastName = formData.lastName || "-";
        
        // בדיקה אם room הוא אובייקט והמרה למזהה אם צריך
        const room = typeof formData.room === 'object' && formData.room._id ? formData.room._id : formData.room;
        
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
        
        console.log('תאריכי הזמנה לשליחה לשרת:', {
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString()
        });
        
        // מבנה JSON להזמנה חדשה/עדכון
        const bookingData = {
          firstName: formData.firstName,
          lastName: lastName,
          phone: formData.phone || '',
          email: formData.email || '',
          
          room: room,
          checkIn: checkInDate,
          checkOut: checkOutDate, // שימוש בתאריך הצ'ק-אאוט שנבחר
          nights: formData.nights || 1,
          isTourist: formData.isTourist || false,
          
          price: formData.price || 0,
          pricePerNight: formData.pricePerNight || 0,
          pricePerNightNoVat: formData.pricePerNightNoVat || 0,
          
          paymentStatus: formData.paymentStatus || 'unpaid',
          creditCard: formData.creditCard || {
            cardNumber: '',
            expiryDate: '',
            cvv: ''
          },
          
          notes: formData.notes || '',
          source: formData.source || 'direct',
          externalBookingNumber: formData.externalBookingNumber || '',
          code: formData.code || '',
          reviewHandled: formData.reviewHandled || false,
          manualInvoiceHandled: formData.manualInvoiceHandled || false,
          passportImageHandled: formData.passportImageHandled || false,
          
          location: location
        };
        
        // אם צריך לשמור את תאריך צ'ק-אאוט לצורך תאימות עם המערכת הקיימת
        if (formData.checkOut) {
          // חישוב תאריך צ'ק-אאוט על פי תאריך צ'ק-אין + מספר לילות
          bookingData.checkOut = addDays(checkInDate, formData.nights);
        }
        
        // אם מדובר בעריכה, שמור את האיידי והשדות הנוספים
        if (isEditMode && editBooking?._id) {
          bookingData._id = editBooking._id;
          
          // שדות נוספים שהיו בהזמנה המקורית אך לא בטופס
          if (editBooking.createdAt) bookingData.createdAt = editBooking.createdAt;
          if (editBooking.updatedAt) bookingData.updatedAt = editBooking.updatedAt;
          if (editBooking.roomNumber) bookingData.roomNumber = editBooking.roomNumber;
        }
        
        // שליחת הנתונים לפונקציית השמירה/עדכון
        onSave(bookingData);
      } catch (error) {
        console.error('שגיאה בתהליך השליחה:', error);
        setError('אירעה שגיאה בעת שליחת הטופס. אנא נסה שנית.');
      } finally {
        setIsSubmitting(false);
      }
    }
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

  // פונקציות טיפול במחיקה
  const handleDeleteClick = () => {
    // ודא שיש פונקציית מחיקה ושאנחנו במצב עריכה עם הזמנה קיימת
    if (onDelete && editBooking && editBooking._id) {
      setDeleteConfirmOpen(true);
    } else {
      console.error('לא ניתן למחוק: חסרה פונקציית מחיקה או נתוני הזמנה');
    }
  };

  const handleDeleteBooking = () => {
    if (onDelete && editBooking?._id) {
      onDelete(editBooking._id);
      setDeleteConfirmOpen(false);
      onClose();
    } else {
      console.error('לא ניתן למחוק: חסרה פונקציית מחיקה או מזהה הזמנה');
      setDeleteConfirmOpen(false);
    }
  };

  // אפקט לטיפול בהמרת אובייקט room למזהה
  useEffect(() => {
    if (editBooking) {
      // בדיקה אם room הוא אובייקט והמרה למזהה
      if (editBooking.room && typeof editBooking.room === 'object' && editBooking.room._id) {
        // עדכון הפורמדטה עם המזהה של החדר במקום האובייקט
        setFormData(prev => ({
          ...prev,
          room: editBooking.room._id
        }));
      }
    }
  }, [editBooking]);

  // פתיחת דיאלוג חשבונית
  // פתיחת דיאלוג סליקת אשראי וחשבוניות
  const handleChargeClick = () => {
    setChargeDialogOpen(true);
  };

  // טיפול בסגירת החלון
  const handleClose = () => {
    // איפוס דגלי העקיבה
    setIsExistingBooking(false);
    if (prevFormState.current) {
      prevFormState.current.hasRoomBeenChanged = false;
    }
    
    // סגירת החלון
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : style.dialog.borderRadius,
          overflow: 'hidden',
          width: isMobile ? '100%' : '95%',
          maxWidth: isMobile ? '100%' : '1000px'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          bgcolor: currentColors.bgLight, 
          color: currentColors.main,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${currentColors.main}`,
          py: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isEditMode ? null : <AddIcon sx={{ marginRight: '10px' }} />}
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              {isEditMode 
                ? `עריכת הזמנה${editBooking?.bookingNumber ? ` ${editBooking.bookingNumber}` : ''} - ${location === 'airport' ? 'אור יהודה' : 'רוטשילד'}`
                : `הזמנה חדשה - ${location === 'airport' ? 'אור יהודה' : 'רוטשילד'}`
              }
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          {/* אייקון סליקת אשראי */}
          <Tooltip title="סליקת אשראי וחשבוניות">
            <IconButton 
              onClick={handleChargeClick} 
              size="small" 
              sx={{ 
                color: currentColors.main,
                bgcolor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.15)',
                }
              }}
            >
              <CreditCardIcon />
            </IconButton>
          </Tooltip>
          
          {/* תג חשבונית - ניתן ללחיצה לסימון ידני */}
          <Tooltip title={hasAnyInvoiceForBooking(formData) ? "יש חשבונית להזמנה זו - לחץ לביטול" : "לחץ לסימון חשבונית ידנית"}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: hasAnyInvoiceForBooking(formData) ? 'rgba(6, 162, 113, 0.1)' : 'rgba(25, 118, 210, 0.08)',
              border: hasAnyInvoiceForBooking(formData) ? '1px solid rgba(6, 162, 113, 0.3)' : '1px solid rgba(25, 118, 210, 0.2)',
              borderRadius: '8px',
              px: 1,
              py: 0.5,
            }}>
              <Checkbox
                checked={hasAnyInvoiceForBooking(formData) || false}
                onChange={() => setFormData({...formData, manualInvoiceHandled: !formData.manualInvoiceHandled})}
                size="small"
                sx={{
                  color: currentColors.main,
                  '&.Mui-checked': {
                    color: '#06a271',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.1rem'
                  },
                  p: 0.5
                }}
              />
              <Typography sx={{ 
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: hasAnyInvoiceForBooking(formData) ? '#06a271' : currentColors.main,
                ml: 0.5
              }}>
                חשבונית
              </Typography>
            </Box>
          </Tooltip>
          
          {/* מעקב חוות דעת */}
          <Tooltip title="טופל בחוות דעת">
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: formData.reviewHandled ? 'rgba(6, 162, 113, 0.1)' : 'rgba(25, 118, 210, 0.08)',
              border: formData.reviewHandled ? '1px solid rgba(6, 162, 113, 0.3)' : '1px solid rgba(25, 118, 210, 0.2)',
              borderRadius: '8px',
              px: 1,
              py: 0.5,
            }}>
              <Checkbox
                checked={formData.reviewHandled || false}
                onChange={(e) => setFormData({...formData, reviewHandled: e.target.checked})}
                size="small"
                sx={{
                  color: currentColors.main,
                  '&.Mui-checked': {
                    color: '#06a271',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.1rem'
                  },
                  p: 0.5
                }}
              />
              <Typography sx={{ 
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: formData.reviewHandled ? '#06a271' : currentColors.main,
                ml: 0.5
              }}>
                חוות דעת
              </Typography>
            </Box>
          </Tooltip>
          

          
          {/* בחירת סטטוס תשלום */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel sx={{ fontSize: '0.875rem' }}>סטטוס תשלום</InputLabel>
            <Select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              label="סטטוס תשלום"
              size="small"
              sx={{
                '& .MuiSelect-select': {
                  paddingRight: '20px',
                  fontSize: '0.875rem'
                },
                bgcolor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
                },
                ...(formData.paymentStatus === 'unpaid' && {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e34a6f',
                    borderWidth: '2px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e34a6f'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e34a6f'
                  }
                }),
                ...(['cash', 'cash2', 'credit_or_yehuda', 'credit_rothschild', 'transfer_mizrahi', 
                   'bit_mizrahi', 'paybox_mizrahi', 'transfer_poalim', 'bit_poalim', 
                   'paybox_poalim', 'other'].includes(formData.paymentStatus) && {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06a271',
                    borderWidth: '2px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06a271'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06a271'
                  }
                })
              }}
            >
              {availablePaymentMethods.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* כפתור סגירה */}
          <Tooltip title="סגירה">
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
        <Grid container spacing={3}>
            {/* חלק 1: פרטי אורח */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${currentColors.main}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <PersonIcon sx={{ color: currentColors.main, marginRight: '10px' }} />
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
                      autoFocus={true}
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="שם משפחה"
                      fullWidth
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      size="small"
                      inputProps={{
                        style: { 
                          textAlign: 'center',
                          paddingRight: '24px',
                          paddingLeft: '24px',
                          direction: 'rtl',
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                  <TextField
                    label="טלפון"
                    fullWidth
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      size="small"
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={6}>
                  <TextField
                    label="אימייל"
                    fullWidth
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                      size="small"
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        },
                        '& .MuiInputLabel-root': {
                          right: 18,
                          left: 'auto',
                          transformOrigin: 'top right'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          textAlign: 'right',
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(0, -9px) scale(0.75)',
                          transformOrigin: 'top right'
                        }
                      }}
                  />
                </Grid>
              </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 2: פרטי כרטיס אשראי */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.red}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CreditCardIcon sx={{ color: accentColors.red, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי אשראי לפיקדון
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
            <Grid item xs={12}>
                    <TextField
                      name="cardNumber"
                      label="מספר כרטיס"
                      fullWidth
                      value={formData.creditCard ? formData.creditCard.cardNumber : ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        creditCard: {...(formData.creditCard || {}), cardNumber: e.target.value}
                      })}
                      inputProps={{ maxLength: 16, dir: "ltr", style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      name="expiryDate"
                      label="תוקף"
                      fullWidth
                      value={formData.creditCard ? formData.creditCard.expiryDate : ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        creditCard: {...(formData.creditCard || {}), expiryDate: e.target.value}
                      })}
                      placeholder="MM/YY"
                      inputProps={{ maxLength: 5, dir: "ltr", style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      name="cvv"
                      label="CVV"
                      fullWidth
                      value={formData.creditCard ? formData.creditCard.cvv : ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        creditCard: {...(formData.creditCard || {}), cvv: e.target.value}
                      })}
                      inputProps={{ maxLength: 4, dir: "ltr", style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 3: פרטי הזמנה */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.green}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <HotelIcon sx={{ color: accentColors.green, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                פרטי הזמנה
              </Typography>
                </Box>
              
              <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={1.7}>
                    <FormControl fullWidth error={!!errors.room} required size="small" sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: style.button.borderRadius,
                      },
                      '& .MuiSelect-select': {
                        paddingRight: '20px',
                        textAlign: 'center',
                      },
                      '& .MuiInputLabel-root': {
                        right: 18,
                        left: 'auto',
                        transformOrigin: 'top right'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        textAlign: 'right',
                      },
                      '& .MuiInputLabel-shrink': {
                        transform: 'translate(0, -9px) scale(0.75)',
                        transformOrigin: 'top right'
                      }
                    }}>
                    <InputLabel>חדר</InputLabel>
                    <Select
                        name="room"
                      value={formData.room}
                        onChange={handleChange}
                        label="חדר"
                        disabled={rooms.length === 0}
                        size="small"
                    >
                        {filteredAndSortedRooms.map(room => (
                        <MenuItem key={room._id} value={room._id}>
                            {`${room.roomNumber}`}
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
                      disablePast={false}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                          error: !!errors.checkIn,
                          helperText: errors.checkIn,
                          size: "small",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: style.button.borderRadius,
                            }
                          }
                      }
                    }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={6} md={2.1}>
                  <DatePicker
                      label="יציאה"
                    value={formData.checkOut}
                    onChange={handleCheckOutChange}
                    minDate={addDays(formData.checkIn, 1)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                          error: !!errors.checkOut,
                          helperText: errors.checkOut,
                          size: "small",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: style.button.borderRadius,
                            }
                          }
                      }
                    }}
                  />
                </Grid>
                
                  <Grid item xs={12} sm={3} md={1.2}>
                  <TextField
                      name="nights"
                    label="לילות"
                    fullWidth
                      type="number"
                    value={formData.nights}
                      onChange={handleNightsChange}
                      error={!!errors.nights}
                      helperText={errors.nights}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3} md={1.2}>
                  <TextField
                      name="guests"
                    label="אורחים"
                    fullWidth
                      type="number"
                    value={formData.guests}
                      onChange={handleChange}
                      error={!!errors.guests}
                      helperText={errors.guests}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: style.button.borderRadius,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2.5}>
                  <FormControl fullWidth size="small" sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: style.button.borderRadius,
                    },
                    '& .MuiSelect-select': {
                      paddingRight: '20px',
                      textAlign: 'center',
                    },
                    '& .MuiInputLabel-root': {
                      right: 18,
                      left: 'auto',
                      transformOrigin: 'top right'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      textAlign: 'right',
                    },
                    '& .MuiInputLabel-shrink': {
                      transform: 'translate(0, -9px) scale(0.75)',
                      transformOrigin: 'top right'
                    }
                  }}>
                    <InputLabel>מקור</InputLabel>
                    <Select
                      name="source"
                      value={formData.source}
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

              </Grid>

              {/* שדה מספר הזמנה חיצוני - מוצג רק כאשר מקור ההזמנה אינו מקומי */}
              {formData.source !== 'direct' && formData.source !== 'home_website' && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      name="externalBookingNumber"
                      label="מספר הזמנה חיצוני"
                      fullWidth
                      value={formData.externalBookingNumber}
                      onChange={handleChange}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#666' }}>#{formData.source}</span>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: style.button.borderRadius,
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              )}
              </Paper>
            </Grid>
            
            {/* חלק 4: פרטי מחיר */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.purple}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <ReceiptIcon sx={{ color: accentColors.purple, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    פרטי מחיר
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                    {/* צ'קבוקס תמונת פספורט - רק אם זה תייר ובמצב עריכה */}
                    {formData.isTourist && isEditMode && (
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
                          onChange={handleTouristChange}
                          color="primary"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: accentColors.purple,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: accentColors.purple,
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
                  {/* רכיב חישוב מחירים */}
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
                    isExistingBooking={isExistingBooking}
                    // פרופס עבור תמונות מיני
                    bookingId={isEditMode ? editBooking?._id : null}
                    attachedImages={attachedImages}
                    onImagesUpdate={handleImagesUpdate}
                    disabled={isSubmitting}
                  />
                </Grid>
              </Paper>
            </Grid>
            
            {/* חלק 5: הערות */}
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: style.card.borderRadius,
                boxShadow: style.card.boxShadow,
                borderTop: `3px solid ${accentColors.orange}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CommentIcon sx={{ color: accentColors.orange, marginRight: '10px' }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    הערות
                  </Typography>
                </Box>
                
              <TextField
                  name="notes"
                fullWidth
                  multiline
                  rows={2}
                value={formData.notes}
                  onChange={handleChange}
                  size="small"
                  placeholder="הקלד הערות נוספות..."
                  inputProps={{
                    style: { 
                      textAlign: 'right',
                      paddingRight: '14px',
                      direction: 'rtl',
                    }
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: style.button.borderRadius,
                    },
                    '& textarea::placeholder': {
                      textAlign: 'right',
                      direction: 'rtl',
                    }
                  }}
                />
              </Paper>
            </Grid>


          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditMode && onDelete && (
            <Button 
              variant="contained"
              onClick={handleDeleteClick}
              color="error"
              sx={{ 
                bgcolor: accentColors.red, 
                '&:hover': { bgcolor: '#c64064' } 
              }}
              startIcon={<DeleteIcon />}
            >
              מחיקה
            </Button>
          )}
        </Box>
        
        <Box sx={{ ml: 'auto' }}>
          <Button onClick={onClose} sx={{ mx: 1 }}>ביטול</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              isEditMode ? 'עדכון' : 'הוספה'
            )}
          </Button>
        </Box>
      </DialogActions>

      {/* חלון אישור מחיקה */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600, color: accentColors.red }}>אישור מחיקה</DialogTitle>
        <DialogContent>
          <DialogContentText>
            האם אתה בטוח שברצונך למחוק את ההזמנה של {formData.firstName} {formData.lastName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">ביטול</Button>
          <Button 
            onClick={handleDeleteBooking} 
            color="error" 
            variant="contained" 
            autoFocus
            sx={{ bgcolor: accentColors.red, '&:hover': { bgcolor: '#c64064' } }}
          >
            מחיקה
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג סליקת אשראי וחשבוניות */}
      <CreditCardChargeDialog
        open={chargeDialogOpen}
        onClose={() => setChargeDialogOpen(false)}
        booking={formData}
        onPaymentSuccess={(bookingId, newPaymentStatus, hasInvoice = false) => {
          console.log('🔄 עדכון סטטוס תשלום בטופס:', { bookingId, newPaymentStatus, hasInvoice });
          // עדכון הסטטוס בנתוני הטופס
          setFormData(prev => ({
            ...prev,
            paymentStatus: newPaymentStatus,
            // אם נוצרה חשבונית, נעדכן גם את השדה
            ...(hasInvoice && { hasInvoiceReceipt: true })
          }));
          
          // אם יש callback לעדכון הזמנה, נקרא לו
          if (onSave && editBooking) {
            const updatedBooking = {
              ...formData,
              paymentStatus: newPaymentStatus
            };
            onSave(updatedBooking);
          }
        }}
      />
    </Dialog>
  );
};

export default NewBookingForm;