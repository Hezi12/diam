/**
 * דיאלוג לסליקת כרטיס אשראי
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Paper,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { 
  ReceiptLong as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AllInclusive as AllInclusiveIcon,
  ArrowBack as ArrowBackIcon,
  Article as ArticleIcon,
  Print as PrintIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import icountService from '../../services/icountService';
import documentService from '../../services/documentService';
import bookingService from '../../services/bookingService';
import PaymentMethodDialog from '../documents/PaymentMethodDialog';
import axios from 'axios';

const CreditCardChargeDialog = ({ open, onClose, booking, onPaymentSuccess }) => {
  // מצב סכום לחיוב
  const [chargeAmount, setChargeAmount] = useState(booking?.price || 0);
  
  // מצב סכום לחשבונית
  const [invoiceAmount, setInvoiceAmount] = useState(booking?.price || 0);
  
  // מצב טעינה ותוצאות
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  

  
  // מצבים נוספים לטיפול בחשבונית נפרדת
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState(null);
  const [invoiceError, setInvoiceError] = useState(null);
  
  // מצב בחירת פעולה (איזה כרטיס נבחר)
  const [selectedAction, setSelectedAction] = useState(null);
  
  // מצב לבדיקת חשבונית קיימת
  const [hasExistingInvoice, setHasExistingInvoice] = useState(false);
  const [existingInvoiceInfo, setExistingInvoiceInfo] = useState(null);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  
  // מצב דיאלוג בחירת אמצעי תשלום
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  
  // מצב לטקסט מידע חשוב באישור הזמנה
  const [importantInfo, setImportantInfo] = useState(
    `• ניתן לבטל את ההזמנה ללא עלות עד 4 ימים לפני תאריך הגעה, לאחר מכן לא ניתן לבטל
• שעת צ'ק אאוט: עד השעה 10:00 בבוקר
• יש לנו מערכת צ'ק אין עצמאי - ביום ההגעה נשלח אליכם את כל הפרטים וההוראות
• במידה ויגיעו אורחים נוספים מעבר למספר שהוזמן, יחולו חיובים נוספים`
  );
  
  // הוק להודעות
  const { enqueueSnackbar } = useSnackbar();
  
  // עדכון הסכום כאשר ההזמנה משתנה
  React.useEffect(() => {
    if (booking?.price && !result) {
      setChargeAmount(booking.price);
      setInvoiceAmount(booking.price);
    }
  }, [booking?.price, result]);
  
  // איפוס הדיאלוג בעת סגירה
  const handleClose = () => {
    if (!loading) {
      resetDialog();
      onClose();
    }
  };
  
  // פונקציה לאיפוס הדיאלוג
  const resetDialog = () => {
    setChargeAmount(booking?.price || 0);
    setInvoiceAmount(booking?.price || 0);
    setLoading(false);
    setResult(null);
    setError(null);
    setInvoiceLoading(false);
    setInvoiceResult(null);
    setInvoiceError(null);
    setSelectedAction(null);
    setHasExistingInvoice(false);
    setExistingInvoiceInfo(null);
    setCheckingInvoice(false);
    setImportantInfo(
      `• ניתן לבטל את ההזמנה ללא עלות עד 4 ימים לפני תאריך הגעה, לאחר מכן לא ניתן לבטל
• שעת צ'ק אאוט: עד השעה 10:00 בבוקר
• יש לנו מערכת צ'ק אין עצמאי - ביום ההגעה נשלח אליכם את כל הפרטים וההוראות
• במידה ויגיעו אורחים נוספים מעבר למספר שהוזמן, יחולו חיובים נוספים`
    );
  };

  // פונקציה ליצירת חשבונית + קבלה
  const handleCreateInvoiceWithReceipt = async (paymentMethod) => {
    try {
      setInvoiceLoading(true);
      setInvoiceError(null);
      setInvoiceResult(null);
      setPaymentMethodDialogOpen(false);
      
      const response = await documentService.createInvoiceWithReceipt(booking._id, paymentMethod);
      
      if (response.success) {
        setInvoiceResult({
          success: true,
          invoice: response.invoice,
          receipt: response.receipt,
          message: response.message
        });
        enqueueSnackbar('חשבונית עם קבלה נוצרה בהצלחה', { variant: 'success' });
      } else {
        throw new Error(response.message || 'שגיאה ביצירת חשבונית עם קבלה');
      }
    } catch (err) {
      console.error('שגיאה ביצירת חשבונית עם קבלה:', err);
      setInvoiceError(err.message || 'שגיאה ביצירת חשבונית עם קבלה');
      enqueueSnackbar('שגיאה ביצירת חשבונית עם קבלה', { variant: 'error' });
    } finally {
      setInvoiceLoading(false);
    }
  };

  // פונקציה חדשה: סליקה + חשבונית-קבלה (מחברת שתי פונקציות קיימות)
  const handleChargeWithInvoiceReceipt = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      console.log('🔄 מתחיל תהליך סליקה + חשבונית-קבלה...');
      
      // 🔧 מבצע סליקה עם חשבונית אוטומטית...
      console.log('💳 מבצע סליקה עם חשבונית אוטומטית...');
      const chargeResponse = await icountService.chargeCard(booking.location, booking._id, chargeAmount, true);
      
      if (!chargeResponse.success) {
        throw new Error(chargeResponse.message || 'סליקה נכשלה');
      }
      
      console.log('✅ סליקה עם חשבונית הושלמה בהצלחה:', chargeResponse);
      
      // 🔧 השדה hasInvoiceReceipt מתעדכן אוטומטית בשרת
      // לא צריך לעדכן ידנית את סטטוס התשלום - זה מתעדכן אוטומטית
      
      console.log('✅ תהליך הושלם בהצלחה!');
      
      // הצגת תוצאה
      const successMessage = chargeResponse.invoice?.success 
        ? `✅ סליקה וחשבונית עם קבלה בוצעו בהצלחה! מספר עסקה: ${chargeResponse.transactionId}, חשבונית: ${chargeResponse.invoice.invoiceNumber}`
        : `✅ סליקה בוצעה בהצלחה! מספר עסקה: ${chargeResponse.transactionId} (חשבונית עם קבלה נכשלה - ניתן ליצור ידנית)`;
      
      enqueueSnackbar(successMessage, { 
        variant: 'success',
        autoHideDuration: 8000
      });
      
      setResult({
        success: true,
        transactionId: chargeResponse.transactionId,
        amount: chargeResponse.amount,
        cardType: chargeResponse.cardType,
        invoice: chargeResponse.invoice,
        hasInvoice: chargeResponse.invoice?.success || false,
        message: successMessage,
        combinedAction: true, // סימון שזו פעולה משולבת
        // הוספת מידע על העדכון האוטומטי
        bookingUpdated: chargeResponse.bookingUpdated
      });
      
      // קריאה לפונקציית callback לרענון הנתונים
      if (onPaymentSuccess) {
        // 🔧 השתמש במידע מהשרת במקום חישוב ידני
        const paymentStatus = chargeResponse.bookingUpdated?.paymentStatus || 
          (booking.location === 'airport' ? 'credit_or_yehuda' : 'credit_rothschild');
        const hasInvoice = chargeResponse.invoice?.success || false;
        onPaymentSuccess(booking._id, paymentStatus, hasInvoice);
      }
      
      // סגירת הדיאלוג אחרי 4 שניות (יותר זמן לקרוא את ההודעה)
      setTimeout(() => {
        onClose();
      }, 4000);
      
    } catch (error) {
      console.error('❌ שגיאה בתהליך סליקה + חשבונית-קבלה:', error);
      setError(error.message || 'שגיאה בתהליך סליקה + חשבונית-קבלה');
      enqueueSnackbar(`שגיאה: ${error.message || 'תהליך נכשל'}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // פונקציה ליצירת חשבונית נפרדת
  const handleCreateInvoice = async () => {
    if (!booking || !booking._id) {
      setInvoiceError('פרטי הזמנה חסרים');
      return;
    }

    setInvoiceLoading(true);
    setInvoiceError(null);
    setInvoiceResult(null);
    
    try {
      const response = await documentService.createDocument(booking._id, 'invoice', invoiceAmount);
      
      if (response.success) {
        setInvoiceResult({
          success: true,
          invoice: response.invoice,
          message: response.message
        });
        
        // הצגת הודעה מתאימה
        if (response.existingInvoice) {
          enqueueSnackbar(`חשבונית נוצרה בהצלחה (חשבונית מס' ${response.existingInvoice.count + 1} להזמנה זו)`, { variant: 'success' });
        } else {
          enqueueSnackbar('החשבונית נוצרה בהצלחה', { variant: 'success' });
        }
      } else {
        throw new Error(response.message || 'שגיאה ביצירת החשבונית');
      }
    } catch (err) {
      console.error('שגיאה ביצירת חשבונית:', err);
      const errorMessage = err.message || 'שגיאה ביצירת החשבונית';
      setInvoiceError(errorMessage);
      enqueueSnackbar(`שגיאה: ${errorMessage}`, { variant: 'error' });
    } finally {
      setInvoiceLoading(false);
    }
  };
  
  // ביצוע הסליקה
  const handleCharge = async (shouldCreateInvoice = false) => {
    // בדיקות תקינות לפני התחלת התהליך
    if (!booking || !booking._id) {
      setError('פרטי הזמנה חסרים');
      return;
    }
    
    if (!booking.creditCard || !booking.creditCard.cardNumber) {
      setError('פרטי כרטיס אשראי חסרים בהזמנה');
      return;
    }
    
    if (!chargeAmount || chargeAmount <= 0) {
      setError('יש להזין סכום תקין לחיוב');
      return;
    }

    // בדיקת תקינות מספר כרטיס (בסיסית)
    const cleanCardNumber = booking.creditCard.cardNumber.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      setError('מספר כרטיס אשראי לא תקין');
      return;
    }

    // בדיקת תוקף
    if (!booking.creditCard.expiryDate) {
      setError('תוקף כרטיס אשראי חסר');
      return;
    }

    // בדיקת פורמט תוקף - תמיכה בפורמטים שונים
    const cleanExpiryDate = booking.creditCard.expiryDate.replace(/\s|-/g, '');
    const isValidFormat = /^(0[1-9]|1[0-2])\/?\d{2}$/.test(cleanExpiryDate) || // MM/YY או MMYY
                         /^(0[1-9]|1[0-2])\d{2}$/.test(cleanExpiryDate) || // MMYY
                         /^\d{2}\/\d{2}$/.test(cleanExpiryDate) || // YY/MM (בטעות)
                         /^\d{4}$/.test(cleanExpiryDate); // MMYY
    
    if (!isValidFormat) {
      setError('תוקף כרטיס אשראי לא תקין');
      return;
    }

    // בדיקת CVV
    if (!booking.creditCard.cvv || !/^\d{3,4}$/.test(booking.creditCard.cvv)) {
      setError('CVV לא תקין (נדרשות 3-4 ספרות)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('🔄 מתחיל תהליך סליקת אשראי...');
      
      // קריאה אמיתית לשרת
      const response = await icountService.chargeCard(booking.location, booking._id, chargeAmount, shouldCreateInvoice);
      
      console.log('✅ תגובה מהשרת:', response);
      
      if (response.success) {
        console.log(`🎉 סליקה הושלמה בהצלחה! מספר עסקה: ${response.transactionId}`);
        
        // 🔧 תיקון: השדות מתעדכנים אוטומטית בשרת
        // לא צריך לעדכן ידנית את סטטוס התשלום - זה מתעדכן אוטומטית
        console.log('✅ השדות עודכנו אוטומטית בשרת:', response.bookingUpdated);
        
        // הצגת הודעת הצלחה
        const successMessage = shouldCreateInvoice 
          ? `✅ הסליקה בוצעה בהצלחה! ${response.invoice ? `חשבונית: ${response.invoice.invoiceNumber || response.invoice.docNum}` : ''}` 
          : '✅ הסליקה בוצעה בהצלחה ללא חשבונית!';
        
        enqueueSnackbar(successMessage, { 
          variant: 'success',
          autoHideDuration: 6000
        });
        
        setResult({
          success: true,
          transactionId: response.transactionId,
          amount: response.amount,
          cardType: response.cardType,
          invoice: response.invoice,
          hasInvoice: response.invoice?.success || false,
          message: successMessage,
          // הוספת מידע על העדכון האוטומטי
          bookingUpdated: response.bookingUpdated
        });
        
        // קריאה לפונקציית callback לרענון הנתונים
        if (onPaymentSuccess) {
          // 🔧 תיקון: השתמש במידע מהשרת במקום חישוב ידני
          const paymentStatus = response.bookingUpdated?.paymentStatus || 
            (booking.location === 'airport' ? 'credit_or_yehuda' : 'credit_rothschild');
          const hasInvoice = response.invoice?.success || false;
          onPaymentSuccess(booking._id, paymentStatus, hasInvoice);
        }
        
        // סגירת הדיאלוג אחרי 3 שניות
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(response.message || 'סליקה נכשלה');
      }
      
    } catch (error) {
      console.error('❌ שגיאה בקריאה לשרת:', error);
      
      let errorMessage;
      if (error.message === 'Failed to fetch') {
        errorMessage = 'בעיה בחיבור לשרת - בדוק חיבור לאינטרנט';
      } else if (error.name === 'TypeError') {
        errorMessage = 'שגיאה טכנית - נסה שוב מאוחר יותר';
      } else {
        errorMessage = error.message || 'שגיאה לא צפויה';
      }
        
      setError(errorMessage);
      enqueueSnackbar(`שגיאה: ${errorMessage}`, { variant: 'error' });
      
    } finally {
      setLoading(false);
    }
  };
  
  // בדיקה אם קיימת חשבונית להזמנה
  const checkIfInvoiceExists = async () => {
    if (!booking || !booking._id) return;
    
    setCheckingInvoice(true);
    try {
      const response = await axios.get(`/api/documents/check-booking/${booking._id}`);
      setHasExistingInvoice(response.data.exists);
      if (response.data.exists && response.data.invoices && response.data.invoices.length > 0) {
        const latestInvoice = response.data.invoices[response.data.invoices.length - 1];
        setExistingInvoiceInfo({
          invoiceNumber: latestInvoice.invoiceNumber || latestInvoice.icountData?.docNumber,
          amount: latestInvoice.amount,
          count: response.data.invoices.length,
          createdAt: latestInvoice.createdAt
        });
      }
    } catch (error) {
      console.error('שגיאה בבדיקת קיום חשבונית:', error);
      setHasExistingInvoice(false);
      setExistingInvoiceInfo(null);
    } finally {
      setCheckingInvoice(false);
    }
  };

  // בדיקת חשבונית קיימת בעת פתיחת הדיאלוג
  React.useEffect(() => {
    if (open && booking) {
      checkIfInvoiceExists();
      // וודא ששני הסכומים מעודכנים
      if (booking.price) {
        setChargeAmount(booking.price);
        setInvoiceAmount(booking.price);
      }
    }
  }, [open, booking]);
  
  // קביעת שם המתחם
  const getLocationName = () => {
    return booking?.location === 'airport' ? 'אור יהודה' : 'רוטשילד';
  };

  // יצירת טקסט אישור הזמנה לווטסאפ
  const generateWhatsAppText = () => {
    if (!booking) return '';
    
    // קביעת פרטי המתחם
    const isAirport = booking.location === 'airport';
    const hotelName = isAirport ? 'Airport Guest House' : 'Rothschild 79';
    const address = isAirport ? 'הארז 12 אור יהודה' : 'רוטשילד 79 פתח תקווה';
    
    return `
שלום ${booking.firstName}

תודה שבחרת להתארח ב-${hotelName}! הזמנה מס׳ ${booking.bookingNumber} אושרה.

*פרטי השהייה:*
צ'ק אין: ${new Date(booking.checkIn).toLocaleDateString('he-IL')}
צ'ק אאוט: ${new Date(booking.checkOut).toLocaleDateString('he-IL')}
מספר לילות: ${booking.nights || 1}
מספר אורחים: ${booking.guests || 1}

*פירוט חיוב:*
לינה עבור ${booking.nights || 1} לילות: ₪${((booking.price || 0) + (booking.discount || 0)).toLocaleString()}${booking.discount > 0 ? `
הנחה: -₪${booking.discount.toLocaleString()}` : ''}

*סה"כ לתשלום: ₪${booking.price.toLocaleString()}*

${booking.notes ? `הערות: ${booking.notes}` : ''}

${importantInfo ? `מידע חשוב:
${importantInfo}` : ''}

לכל שאלה ופנייה אנחנו זמינים :)
    `.trim();
  };

  // יצירת טקסט אישור הזמנה להדפסה
  const generateBookingConfirmationText = () => {
    if (!booking) return '';
    
    // קביעת פרטי המתחם
    const isAirport = booking.location === 'airport';
    const hotelName = isAirport ? 'Airport Guest House' : 'Rothschild 79';
    const address = isAirport ? 'הארז 12 אור יהודה' : 'רוטשילד 79 פתח תקווה';
    
    return `
${hotelName}
${address}
טלפון: 0506070260 | מייל: diamshotels@gmail.com

אישור הזמנה #${booking.bookingNumber}

לכבוד
${booking.firstName} ${booking.lastName}
טלפון: ${booking.phone}

פרטי השהייה:
צ'ק אין: ${new Date(booking.checkIn).toLocaleDateString('he-IL')}
צ'ק אאוט: ${new Date(booking.checkOut).toLocaleDateString('he-IL')}
מספר לילות: ${booking.nights || 1}
מספר אורחים: ${booking.guests || 1}

פירוט חיוב:
לינה עבור ${booking.nights || 1} לילות: ₪${((booking.price || 0) + (booking.discount || 0)).toLocaleString()}${booking.discount > 0 ? `
הנחה: -₪${booking.discount.toLocaleString()}` : ''}

סה"כ לתשלום: ₪${booking.price.toLocaleString()}

מידע חשוב:
${importantInfo}

תודה שבחרת ב-${hotelName} - מחכים לראותך!
    `.trim();
  };

  // יצירת קישור WhatsApp
  const generateWhatsAppLink = () => {
    if (!booking?.phone) return '';
    
    // ניקוי מספר הטלפון - הסרת רווחים ומקפים
    const cleanPhone = booking.phone.replace(/[\s\-()]/g, '');
    
    // וידוא שמתחיל ב-972 (קוד ישראל) או הוספה
    let whatsappPhone = cleanPhone;
    if (whatsappPhone.startsWith('0')) {
      whatsappPhone = '972' + whatsappPhone.substring(1);
    } else if (!whatsappPhone.startsWith('972') && !whatsappPhone.startsWith('+972')) {
      whatsappPhone = '972' + whatsappPhone;
    }
    
    // הסרת + אם קיים
    whatsappPhone = whatsappPhone.replace('+', '');
    
    const message = generateWhatsAppText();
    const encodedMessage = encodeURIComponent(message);
    
    // שימוש ב-wa.me שעובד גם על דסקטופ וגם על מובייל
    return `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
  };

  // שליחה בווטסאפ
  const handleWhatsAppSend = () => {
    if (!booking?.phone) {
      enqueueSnackbar('מספר טלפון חסר עבור הזמנה זו', { variant: 'warning' });
      return;
    }

    try {
      const whatsappUrl = generateWhatsAppLink();
      if (whatsappUrl) {
        // פתיחת קישור WhatsApp
        window.open(whatsappUrl, '_blank');
        enqueueSnackbar('נפתח קישור WhatsApp', { variant: 'success' });
      } else {
        enqueueSnackbar('שגיאה ביצירת קישור WhatsApp', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating WhatsApp link:', error);
      enqueueSnackbar('שגיאה בשליחה לווטסאפ', { variant: 'error' });
    }
  };

  // יצירת HTML אישור הזמנה להדפסה
  const generateBookingConfirmationHTML = () => {
    if (!booking) return '';
    
    // קביעת פרטי המתחם
    const isAirport = booking.location === 'airport';
    const hotelName = isAirport ? 'Airport Guest House' : 'Rothschild 79';
    const address = isAirport ? 'הארז 12 אור יהודה' : 'רוטשילד 79 פתח תקווה';
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אישור הזמנה ${booking.bookingNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #1976d2;
        }
        .header h1 {
            color: #1976d2;
            margin: 0;
            font-size: 2.5em;
            font-weight: bold;
        }
        .header h2 {
            color: #666;
            margin: 10px 0 0 0;
            font-weight: normal;
        }
        .section {
            margin-bottom: 25px;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .section h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 1.3em;
            border-bottom: 2px solid #e3f2fd;
            padding-bottom: 8px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-item strong {
            color: #333;
            display: inline-block;
            min-width: 120px;
        }
        .total-price {
            font-size: 1.5em;
            color: #4caf50;
            font-weight: bold;
            text-align: center;
            padding: 15px;
            background: #e8f5e8;
            border-radius: 8px;
            margin: 20px 0;
        }
        .important-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .important-info h3 {
            color: #856404;
            margin-top: 0;
        }
        .important-info ul {
            margin: 0;
            padding-right: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0 0 5px 0; font-size: 1.8em;">${hotelName}</h1>
            <h2 style="margin: 0 0 5px 0; font-size: 1.2em;">${address}</h2>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 0.9em;">טלפון: 0506070260 | מייל: diamshotels@gmail.com</p>
            <h2 style="margin: 10px 0; font-size: 1.3em;">אישור הזמנה #${booking.bookingNumber}</h2>
        </div>

        <div style="margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #ddd;">
            <h3 style="margin: 0 0 4px 0; color: #333; font-size: 1.1em;">לכבוד</h3>
            <p style="margin: 0; font-size: 1.1em; font-weight: bold;">${booking.firstName} ${booking.lastName}</p>
            <p style="margin: 2px 0 0 0; color: #666;">טלפון: ${booking.phone}</p>
        </div>

        <div style="margin-bottom: 12px;">
            <h3 style="margin: 0 0 6px 0; padding-bottom: 4px; border-bottom: 1px solid #ddd; color: #333; font-size: 1.1em;">פרטי השהייה</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px;">
                <div>
                    <strong>צ'ק אין:</strong><br/>
                    ${new Date(booking.checkIn).toLocaleDateString('he-IL')}
                </div>
                <div>
                    <strong>צ'ק אאוט:</strong><br/>
                    ${new Date(booking.checkOut).toLocaleDateString('he-IL')}
                </div>
                <div>
                    <strong>מספר לילות:</strong><br/>
                    ${booking.nights || 1}
                </div>
                <div>
                    <strong>מספר אורחים:</strong><br/>
                    ${booking.guests || 1}
                </div>
            </div>
        </div>

        <div style="margin-bottom: 15px;">
            <h3 style="margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #ddd; color: #333;">פירוט חיוב</h3>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                    <span>לינה עבור ${booking.nights || 1} לילות</span>
                    <span style="font-weight: 500;">₪${((booking.price || 0) + (booking.discount || 0)).toLocaleString()}</span>
                </div>
                
                ${booking.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd;">
                    <span style="color: #4caf50;">הנחה</span>
                    <span style="font-weight: 500; color: #4caf50;">-₪${booking.discount.toLocaleString()}</span>
                </div>
                ` : ''}
            </div>

            <div style="display: flex; justify-content: space-between; padding: 10px; border-top: 2px solid #333; background-color: #f5f5f5; font-weight: bold; font-size: 1.1em;">
                <span>סה"כ לתשלום</span>
                <span style="color: #1976d2;">₪${booking.price.toLocaleString()}</span>
            </div>
        </div>

        ${booking.notes ? `
        <div style="margin-bottom: 10px;">
            <h3 style="margin: 0 0 4px 0; padding-bottom: 4px; border-bottom: 1px solid #ddd; color: #333; font-size: 1.1em;">הערות</h3>
            <p style="margin: 4px 0 0 0;">${booking.notes}</p>
        </div>
        ` : ''}

        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ffa726; border-radius: 5px; background-color: #fff3e0;">
            <h3 style="margin: 0 0 4px 0; color: #e65100; font-size: 1.1em;">מידע חשוב</h3>
            <div style="white-space: pre-line; line-height: 1.4; margin-top: 4px;">
                ${importantInfo}
            </div>
        </div>

        <div class="footer">
            <p style="margin: 8px 0 0 0;"><em>תודה שבחרת ב-${hotelName} - מחכים לראותך!</em></p>
        </div>
    </div>
</body>
</html>
    `.trim();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 0.5, 
        pt: 2,
        px: 2
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          fontSize: '1.1rem'
        }}>
          סליקת אשראי וחשבוניות
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 2, py: 1 }}>
        {/* פרטי הזמנה */}
          {booking && (
            <Box sx={{ 
            p: 1.5, 
            mb: 2,
              bgcolor: 'grey.50', 
            borderRadius: 1,
              border: '1px solid',
            borderColor: 'grey.300'
            }}>
            <Typography variant="body2" gutterBottom sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
              mb: 1,
              fontSize: '0.9rem'
              }}>
                פרטי הזמנה
              </Typography>
            <Grid container spacing={0.5} alignItems="center">
              <Grid item xs={2.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', display: 'block' }}>מספר הזמנה</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.95rem' }}>
                  {booking.bookingNumber}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', display: 'block' }}>אורח</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {booking.firstName} {booking.lastName}
                </Typography>
              </Grid>
              <Grid item xs={2.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', display: 'block' }}>מע״מ</Typography>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: booking.isTourist ? 'success.main' : 'primary.main',
                  fontSize: '0.95rem'
                }}>
                  {booking.isTourist ? 'תייר' : 'ישראלי'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem', display: 'block' }}>מחיר כולל</Typography>
                <Typography variant="body1" sx={{ 
                  fontWeight: 700,
                  color: 'success.main',
                  fontSize: '1.1rem'
                }}>
                  ₪{booking.price || 0}
                </Typography>
              </Grid>
            </Grid>
            </Box>
          )}

        {!selectedAction ? (
          /* בחירת פעולה - 3 כרטיסים */
          <Box>

            
            <Grid container spacing={2}>

              {/* אפשרות 1: סליקה בלבד (לבדיקה) */}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: 'secondary.main'
                    }
                  }}
                  onClick={() => setSelectedAction('charge_only')}
                >
                  <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                    <CreditCardIcon sx={{ 
                      fontSize: 36, 
                      color: 'secondary.main', 
                      mb: 0.5 
                    }} />
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      סליקה בלבד (לבדיקה)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* אפשרות 2: סליקה + חשק */}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '2px solid',
                    borderColor: 'error.light',
                    background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.03) 0%, rgba(244, 67, 54, 0.08) 100%)',
                    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.15)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(244, 67, 54, 0.25)',
                      borderColor: 'error.main',
                      background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.12) 100%)'
                    }
                  }}
                  onClick={() => setSelectedAction('charge_with_invoice_receipt')}
                >
                  <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                    <AllInclusiveIcon sx={{ 
                      fontSize: 36, 
                      color: 'error.main', 
                      mb: 0.5 
                    }} />
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      סליקה + חשק
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* אפשרות 3: חשבונית בלבד */}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: 'success.main'
                    }
                  }}
                  onClick={() => setSelectedAction('invoice_only')}
                >
                  <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                    <ReceiptIcon sx={{ 
                      fontSize: 36, 
                      color: 'success.main', 
                      mb: 0.5 
                    }} />
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      חשבונית בלבד
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* אפשרות 4: חשבונית + קבלה */}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: 'warning.main'
                    }
                  }}
                  onClick={() => setSelectedAction('invoice_receipt')}
                >
                  <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                    <ReceiptIcon sx={{ 
                      fontSize: 36, 
                      color: 'warning.main', 
                      mb: 0.5 
                    }} />
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      חשבונית + קבלה
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* אפשרות 5: אישור הזמנה */}
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: 'info.main'
                    }
                  }}
                  onClick={() => setSelectedAction('booking_confirmation')}
                >
                  <CardContent sx={{ textAlign: 'center', p: 1.5 }}>
                    <ArticleIcon sx={{ 
                      fontSize: 36, 
                      color: 'info.main', 
                      mb: 0.5 
                    }} />
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      אישור הזמנה
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          /* תוכן הפעולה הנבחרת */
          <Box>
            {/* תוכן לפי בחירה */}
            {(selectedAction === 'charge_only' || selectedAction === 'charge_with_invoice_receipt') && (
              <Box sx={{ mb: 2 }}>
            <TextField
              label="סכום לחיוב"
              type="number"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
              fullWidth
              variant="outlined"
                  size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
                sx: {
                      fontSize: '0.9rem',
                  fontWeight: 500
                }
              }}
              InputLabelProps={{
                    sx: { fontWeight: 500, fontSize: '0.9rem' }
              }}
              disabled={loading || result}
              sx={{
                '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                  bgcolor: 'background.paper',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderWidth: 2,
                  }
                }
              }}
            />
          </Box>
            )}

            {/* שדה סכום לחשבונית בלבד או חשבונית + קבלה */}
            {(selectedAction === 'invoice_only' || selectedAction === 'invoice_receipt') && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="סכום החשבונית"
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(parseFloat(e.target.value) || 0)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₪</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 },
                    sx: {
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }
                  }}
                  InputLabelProps={{
                    sx: { fontWeight: 500, fontSize: '0.9rem' }
                  }}
                  disabled={invoiceLoading || invoiceResult}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'success.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderWidth: 2,
                        borderColor: 'success.main',
                      }
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        )}
        
        {/* תוכן תוצאות וטעינה - רק כאשר נבחרה אפשרות */}
        {selectedAction && (
          <Box>
            {/* כותרת עם כפתור חזרה - מוצג תמיד כשנבחרה אפשרות */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button 
                onClick={() => setSelectedAction(null)}
                variant="outlined"
                size="small"
                disabled={loading || invoiceLoading}
                startIcon={<ArrowBackIcon />}
                sx={{ mr: 2 }}
              >
                חזור לבחירה
              </Button>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedAction === 'charge_only' && 'סליקה בלבד (לבדיקה)'}
                {selectedAction === 'charge_with_invoice_receipt' && 'סליקה + חשק'}
                {selectedAction === 'invoice_only' && 'חשבונית בלבד'}
                {selectedAction === 'invoice_receipt' && 'חשבונית + קבלה'}
                {selectedAction === 'booking_confirmation' && 'אישור הזמנה'}
              </Typography>
        </Box>
        
        {/* מצב טעינה */}
            {((selectedAction === 'charge_only' || selectedAction === 'charge_with_invoice_receipt') && loading) && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 4,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body1" sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}>
              מבצע סליקה...
            </Typography>
          </Box>
        )}
        
            {/* מצב טעינה לחשבונית בלבד או חשבונית + קבלה */}
            {(selectedAction === 'invoice_only' || selectedAction === 'invoice_receipt') && invoiceLoading && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                py: 4,
                flexDirection: 'column',
                gap: 2
              }}>
                <CircularProgress size={40} thickness={4} />
                <Typography variant="body1" sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500
                }}>
                  יוצר חשבונית...
                </Typography>
              </Box>
            )}
            
            {/* הצגת שגיאות */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontWeight: 500
              }
            }}
          >
            {error}
          </Alert>
        )}

            {invoiceError && (selectedAction === 'invoice_only' || selectedAction === 'invoice_receipt') && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontWeight: 500
                  }
                }}
              >
                {invoiceError}
              </Alert>
            )}
        
        {/* תוצאת הסליקה */}
            {result && (selectedAction === 'charge_only' || selectedAction === 'charge_with_invoice_receipt') && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
                  mt: 2, 
              backgroundColor: result.success ? 'success.light' : 'error.light',
              color: result.success ? 'success.contrastText' : 'error.contrastText',
              borderRadius: 2,
              border: '2px solid',
              borderColor: result.success ? 'success.main' : 'error.main'
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {result.success ? '✅ סליקה הושלמה בהצלחה!' : '❌ סליקה נכשלה'}
            </Typography>
            
            {result.success && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  מספר עסקה: <strong>{result.transactionId}</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  סכום שנוע: <strong>{result.amount} ₪</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
                  סוג כרטיס: <strong>{result.cardType}</strong>
                </Typography>
                

                  </Box>
                )}
              </Paper>
            )}

            {/* תוצאת יצירת החשבונית */}
            {invoiceResult && (selectedAction === 'invoice_only' || selectedAction === 'invoice_receipt') && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                    mt: 2, 
                  backgroundColor: invoiceResult.success ? 'success.light' : 'error.light',
                  color: invoiceResult.success ? 'success.contrastText' : 'error.contrastText',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: invoiceResult.success ? 'success.main' : 'error.main'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {invoiceResult.success ? '✅ חשבונית נוצרה בהצלחה!' : '❌ יצירת חשבונית נכשלה'}
                </Typography>
                
                {invoiceResult.success && invoiceResult.invoice && (
                  <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                    מספר חשבונית: <strong>{invoiceResult.invoice.docNum || invoiceResult.invoice.invoiceNumber}</strong>
                  </Typography>
                )}
                
                {/* הצגת קבלה אם קיימת */}
                {invoiceResult.success && invoiceResult.receipt && (
                  <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                    מספר קבלה: <strong>{invoiceResult.receipt.docNum || invoiceResult.receipt.invoiceNumber}</strong>
                  </Typography>
                )}
                
                {/* הצגת הודעה מפורטת מהשרת */}
                {invoiceResult.success && invoiceResult.message && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {invoiceResult.message}
                  </Typography>
                )}
              </Paper>
            )}

            {/* אישור הזמנה */}
            {selectedAction === 'booking_confirmation' && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mt: 2, 
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'info.main'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                    📄 אישור הזמנה
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<WhatsAppIcon />}
                      onClick={handleWhatsAppSend}
                      sx={{ 
                        borderRadius: 2,
                        color: '#25D366',
                        borderColor: '#25D366',
                        '&:hover': {
                          backgroundColor: '#25D366',
                          color: 'white',
                          borderColor: '#25D366'
                        }
                      }}
                    >
                      שלח בווטסאפ
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PrintIcon />}
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(generateBookingConfirmationHTML());
                        printWindow.document.close();
                        printWindow.print();
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      הדפס
                    </Button>
                  </Box>
                </Box>

                {/* תוכן אישור ההזמנה */}
                <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
                  {/* כותרת */}
                  <Box sx={{ textAlign: 'center', mb: 2, borderBottom: '2px solid', borderColor: 'info.main', pb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main', mb: 0.5 }}>
                      {booking?.location === 'airport' ? 'Airport Guest House' : 'Rothschild 79'}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
                      {booking?.location === 'airport' ? 'הארז 12 אור יהודה' : 'רוטשילד 79 פתח תקווה'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 0.5 }}>
                      טלפון: 0506070260 | מייל: diamshotels@gmail.com
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main', mt: 1 }}>
                      אישור הזמנה #{booking?.bookingNumber}
                    </Typography>
                  </Box>

                  {/* לכבוד */}
                  <Box sx={{ mb: 2, py: 1, borderBottom: '1px solid', borderColor: 'grey.300' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                      לכבוד
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {booking?.firstName} {booking?.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      טלפון: {booking?.phone}
                    </Typography>
                  </Box>

                  {/* פרטי השהייה */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, pb: 0.5, borderBottom: '1px solid', borderColor: 'grey.300' }}>
                      פרטי השהייה
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>צ'ק אין:</strong><br/>
                          {new Date(booking?.checkIn).toLocaleDateString('he-IL')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>צ'ק אאוט:</strong><br/>
                          {new Date(booking?.checkOut).toLocaleDateString('he-IL')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>מס' לילות:</strong><br/>
                          {booking?.nights || 1}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>מס' אורחים:</strong><br/>
                          {booking?.guests || 1}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* פירוט חיוב */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1, pb: 0.5, borderBottom: '1px solid', borderColor: 'grey.300' }}>
                      פירוט חיוב
                    </Typography>
                    
                    {/* פריטי החיוב */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
                        <Typography variant="body2">
                          לינה עבור {booking?.nights || 1} לילות
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          ₪{((booking?.price || 0) + (booking?.discount || 0)).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {booking?.discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
                          <Typography variant="body2" sx={{ color: 'success.main' }}>
                            הנחה
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                            -₪{booking?.discount?.toLocaleString()}
                          </Typography>
              </Box>
            )}
                    </Box>

                    {/* סה"כ לתשלום */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2, borderTop: '2px solid', borderColor: 'text.primary', bgcolor: 'grey.50' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        סה"כ לתשלום
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ₪{booking?.price?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* הערות נוספות */}
                  {booking?.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, pb: 0.5, borderBottom: '1px solid', borderColor: 'grey.300' }}>
                        הערות
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {booking.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* מידע חשוב */}
                  <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'warning.main', borderRadius: 1, bgcolor: 'warning.50' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.dark', mb: 0.5 }}>
                      מידע חשוב
                    </Typography>
                    <TextField
                      multiline
                      rows={3}
                      value={importantInfo}
                      onChange={(e) => setImportantInfo(e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      placeholder="הכנס מידע חשוב למסמך..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          borderRadius: 1,
                          '& fieldset': {
                            borderColor: 'warning.main',
                          },
                          '&:hover fieldset': {
                            borderColor: 'warning.dark',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'warning.dark',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          fontFamily: 'inherit',
                        }
                      }}
                      InputProps={{
                        sx: {
                          fontSize: '0.9rem',
                          color: 'text.primary',
                          '& textarea': {
                            resize: 'vertical',
                          }
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'warning.dark', mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                      ניתן לערוך את המידע החשוב שיופיע באישור ההזמנה
                    </Typography>
                  </Box>

                  {/* חתימה */}
                  <Box sx={{ textAlign: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'grey.300' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      תודה שבחרת ב-{booking?.location === 'airport' ? 'Airport Guest House' : 'Rothschild 79'} - מחכים לראותך!
                    </Typography>
                  </Box>
                </Box>
          </Paper>
        )}
        
            {/* הודעה אם אין פרטי אשראי - רק עבור סליקה */}
            {(selectedAction === 'charge_only' || selectedAction === 'charge_with_invoice_receipt') && 
             booking && (!booking.creditCard || !booking.creditCard.cardNumber) && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            לא נמצאו פרטי כרטיס אשראי להזמנה זו.
          </Alert>
            )}

            {/* התרעה אם יש כבר חשבונית ונבחר "סליקה + חשק" */}
            {selectedAction === 'charge_with_invoice_receipt' && hasExistingInvoice && existingInvoiceInfo && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ⚠️ <strong>קיימת כבר חשבונית להזמנה זו</strong><br/>
                  מספר חשבונית: <strong>{existingInvoiceInfo.invoiceNumber}</strong> | סכום: <strong>₪{existingInvoiceInfo.amount}</strong><br/>
                  <em>הסליקה תתבצע ותיווצר חשק חדש נוסף</em>
                </Typography>
              </Alert>
            )}

            {/* התרעה אם יש כבר חשבונית ונבחר "חשבונית בלבד" או "חשבונית + קבלה" */}
            {(selectedAction === 'invoice_only' || selectedAction === 'invoice_receipt') && hasExistingInvoice && existingInvoiceInfo && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ⚠️ <strong>קיימות כבר {existingInvoiceInfo.count} חשבוניות להזמנה זו</strong><br/>
                  חשבונית אחרונה: <strong>{existingInvoiceInfo.invoiceNumber}</strong> | סכום: <strong>₪{existingInvoiceInfo.amount}</strong><br/>
                  <em>תיווצר חשבונית חדשה נוספת</em>
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        display: 'flex',
        justifyContent: selectedAction ? 'space-between' : 'flex-end',
        alignItems: 'center',
        gap: 2
      }}>
        {/* כפתור ביטול - תמיד מוצג */}
          <Button 
            onClick={handleClose} 
          disabled={loading || invoiceLoading}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              fontWeight: 500
            }}
          >
          {selectedAction ? 'סגור' : 'ביטול'}
          </Button>

        {/* כפתור פעולה - מוצג רק כאשר נבחרה אפשרות */}
        {selectedAction && selectedAction !== 'booking_confirmation' && (
          <Button 
            onClick={
              selectedAction === 'charge_only' 
                ? () => handleCharge(false)
                : selectedAction === 'charge_with_invoice_receipt'
                  ? handleChargeWithInvoiceReceipt
                  : selectedAction === 'invoice_receipt'
                    ? () => setPaymentMethodDialogOpen(true)
                    : handleCreateInvoice
            }
            disabled={
              (selectedAction === 'invoice_only' || selectedAction === 'invoice_receipt')
                ? invoiceLoading || invoiceResult || (!invoiceAmount || invoiceAmount <= 0)
                : loading || result || 
                  ((selectedAction === 'charge_only' || selectedAction === 'charge_with_invoice_receipt') && 
                   (!chargeAmount || chargeAmount <= 0))
            }
            variant="contained"
            size="large"
            sx={{ 
              borderRadius: 2,
              fontWeight: 600,
              px: 4,
              py: 1.5,
              minWidth: 150
            }}
          >
            {selectedAction === 'charge_only' && (loading ? 'מבצע סליקה...' : `בצע סליקה (${chargeAmount} ₪)`)}
            {selectedAction === 'charge_with_invoice_receipt' && (loading ? 'מבצע סליקה + חשק...' : `בצע סליקה + חשק (${chargeAmount} ₪)`)}
            {selectedAction === 'invoice_only' && (invoiceLoading ? 'יוצר חשבונית...' : `צור חשבונית (${invoiceAmount} ₪)`)}
            {selectedAction === 'invoice_receipt' && (invoiceLoading ? 'יוצר חשבונית + קבלה...' : `צור חשבונית + קבלה (${invoiceAmount} ₪)`)}
          </Button>
        )}
      </DialogActions>

      {/* דיאלוג בחירת אמצעי תשלום */}
      <PaymentMethodDialog
        open={paymentMethodDialogOpen}
        onClose={() => setPaymentMethodDialogOpen(false)}
        onSelectPaymentMethod={handleCreateInvoiceWithReceipt}
        booking={booking}
      />
    </Dialog>
  );
};

export default CreditCardChargeDialog; 