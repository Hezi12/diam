import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Translate as TranslateIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import invoiceService from '../../services/invoiceService';
import logService from '../../services/logService';
import BookingConfirmation from '../bookings/BookingConfirmation';

/**
 * דיאלוג יצירת חשבונית
 * תואם לדרישות חוק מס ערך מוסף בישראל
 */
const CreateInvoiceDialog = ({ 
  open, 
  onClose, 
  bookingData, 
  onSave = null,
  businessInfo = {
    name: "דיאם אס הוטלס",
    name_en: "Diam S Hotels",
    address: "רוטשילד 79, פתח תקווה",
    address_en: "Rothschild St., Petah Tikva 79",
    address_airport: "הארז 12, אור יהודה",
    address_airport_en: "12 HaErez St., Or Yehuda",
    phone: "03-1234567",
    email: "info@diamhotels.co.il",
    website: "www.diamhotels.co.il",
    taxId: "516679909"
  }
}) => {
  // סטייל בסיסי
  const style = {
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    fontFamily: 'Assistant, Arial, sans-serif'
  };

  // צבעי אקסנט
  const accentColors = {
    primary: '#333333',
    secondary: '#555555',
    accent: '#007bff',
    light: '#f8f9fa',
    dark: '#343a40',
    border: '#dee2e6',
    success: '#28a745',
    error: '#dc3545'
  };
  
  // מצב שפת החשבונית (עברית/אנגלית)
  const [isEnglish, setIsEnglish] = useState(false);

  // הוק להודעות מערכת
  const { enqueueSnackbar } = useSnackbar();
  
  // משתנה מצב חדש שעוקב אחר ביצוע קריאה מוצלחת
  const [invoiceNumberFetched, setInvoiceNumberFetched] = useState(false);
  
  // ref למניעת קריאות כפולות
  const isRequestPendingRef = useRef(false);
  
  // מצב ששומר אם החשבונית נשמרה בשרת
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  
  // שמירת מזהה החשבונית לאחר שמירה
  const [savedInvoiceId, setSavedInvoiceId] = useState(null);

  // מצב החשבונית
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    documentType: 'invoice', // חשבונית מס, חשבונית מס/קבלה, אישור הזמנה
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    customer: {
      name: '',
      identifier: '', // ת.ז או ח.פ.
      address: '',
      phone: '',
      email: ''
    },
    items: [
      {
        description: 'לינה',
        description_en: 'Accommodation',
        roomType: '',
        dateRange: '',
        dateRange_en: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }
    ],
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    discount: 0,
    total: 0,
    notes: '',
    paymentMethod: 'cash',
    paymentDetails: {
      cardLastDigits: '',
      checkNumber: '',
      bankTransferRef: '',
      otherDetails: ''
    }
  });

  // מצב טעינה
  const [isLoading, setIsLoading] = useState(false);
  
  // מצב התראות
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // רפרנס לתוכן החשבונית
  const invoiceContentRef = useRef(null);

  // מצב אישור הזמנה
  const [bookingConfirmationOpen, setBookingConfirmationOpen] = useState(false);

  // עדכון נתוני החשבונית מנתוני ההזמנה
  useEffect(() => {
    if (bookingData) {
      // חישוב תאריכי שהייה
      const checkInDate = new Date(bookingData.checkIn);
      const checkOutDate = new Date(bookingData.checkOut);
      
      const formattedCheckIn = checkInDate.toLocaleDateString('he-IL');
      const formattedCheckOut = checkOutDate.toLocaleDateString('he-IL');
      
      const formattedCheckInEn = checkInDate.toLocaleDateString('en-US');
      const formattedCheckOutEn = checkOutDate.toLocaleDateString('en-US');
      
      // תיאור של השירות
      const serviceDescription = `לינה`;
      const serviceDescriptionEn = `Accommodation`;
      const dateRange = `${formattedCheckIn} - ${formattedCheckOut}`;
      const dateRangeEn = `${formattedCheckInEn} - ${formattedCheckOutEn}`;
      
      // חישוב סכומים
      const priceWithTax = bookingData.price || 0;
      const taxRate = 18;
      const subtotal = priceWithTax / 1.18; // מחיר לפני מע"מ עם מע"מ 18%
      const taxAmount = priceWithTax - subtotal; // סכום המע"מ
      const pricePerNight = subtotal / (bookingData.nights || 1);
      
      setInvoiceData(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          name: `${bookingData.firstName} ${bookingData.lastName}`,
          phone: bookingData.phone || '',
          email: bookingData.email || ''
        },
        checkInDate: formattedCheckIn,
        checkOutDate: formattedCheckOut,
        checkInDateEn: formattedCheckInEn,
        checkOutDateEn: formattedCheckOutEn,
        nights: bookingData.nights || 1,
        items: [
          {
            description: serviceDescription,
            description_en: serviceDescriptionEn,
            roomType: bookingData.roomType || 'חדר',
            roomType_en: bookingData.roomType_en || 'Room',
            dateRange: dateRange,
            dateRange_en: dateRangeEn,
            quantity: bookingData.nights || 1,
            unitPrice: parseFloat(pricePerNight.toFixed(2)),
            totalPrice: parseFloat(subtotal.toFixed(2))
          }
        ],
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxRate: taxRate,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(priceWithTax.toFixed(2))
      }));
    }
  }, [bookingData]);

  // איפוס המצב כשהדיאלוג נסגר
  useEffect(() => {
    if (!open) {
      // איפוס מצב שמירת החשבונית
      setInvoiceSaved(false);
      setSavedInvoiceId(null);
    }
  }, [open]);
  
  // פונקציה נפרדת לקבלת מספר חשבונית
  const fetchInvoiceNumber = async () => {
    // אם כבר יש בקשה פעילה או כבר קיבלנו מספר חשבונית, נצא מהפונקציה
    if (isRequestPendingRef.current || invoiceNumberFetched || !open) {
      return;
    }
    
    // מסמן שיש בקשה פעילה
    isRequestPendingRef.current = true;
    
    try {
      setIsLoading(true);
      
      // הגדרת המיקום מנתוני ההזמנה אם קיימים, אחרת ברירת מחדל 'rothschild'
      const location = bookingData?.location || 'rothschild';
      
      // שליחת בקשה לקבלת מספר חשבונית עם פרמטר המיקום
      const nextNumber = await invoiceService.getNextInvoiceNumber(location);
      
      // קבלת פרטי העסק המעודכנים לפי המיקום
      const businessAddressInfo = getBusinessInfoForLocation(location);
      
      setInvoiceData(prev => ({
        ...prev,
        invoiceNumber: nextNumber,
        location: location, // שמירת המיקום במידע החשבונית
        // עדכון פרטי העסק בהתאם למיקום
        business: {
          ...prev.business,
          address: businessAddressInfo.address,
          address_en: businessAddressInfo.address_en
        }
      }));
      
      // מציין שקיבלנו בהצלחה מספר חשבונית
      setInvoiceNumberFetched(true);
    } catch (error) {
      console.error('שגיאה בקבלת מספר חשבונית הבא:', error);
      enqueueSnackbar(
        isEnglish 
          ? 'Error fetching invoice number' 
          : 'שגיאה בקבלת מספר חשבונית',
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
      // מסמן שאין בקשה פעילה
      isRequestPendingRef.current = false;
    }
  };

  // קבלת מספר חשבונית הבא כאשר הדיאלוג נפתח
  useEffect(() => {
    // איפוס מצב הקריאה כשהדיאלוג נסגר
    if (!open) {
      setInvoiceNumberFetched(false);
      isRequestPendingRef.current = false;
      return;
    }
    
    // קורא לפונקציה רק אם הדיאלוג פתוח וטרם קיבלנו מספר חשבונית
    if (open && !invoiceNumberFetched && !isRequestPendingRef.current) {
      fetchInvoiceNumber();
    }
    
    // פונקציית ניקוי שמתבצעת כשהקומפוננטה נעלמת או כשמשתנה אחד הערכים בתלויות
    return () => {
      if (!open) {
        // אפס את המצבים המקומיים כשהדיאלוג נסגר
        setInvoiceNumberFetched(false);
        isRequestPendingRef.current = false;
      }
    };
  }, [open]);
  
  // איפוס הנתונים כשמשתנה השפה או פרטי העסק
  useEffect(() => {
    if (open && invoiceNumberFetched && !isRequestPendingRef.current) {
      // אם השפה השתנתה או פרטי העסק, עדכן כתובת בהתאם למיקום הנוכחי
      const location = invoiceData.location || (bookingData?.location || 'rothschild');
      const businessAddressInfo = getBusinessInfoForLocation(location);
      
      setInvoiceData(prev => ({
        ...prev,
        business: {
          ...prev.business,
          address: businessAddressInfo.address,
          address_en: businessAddressInfo.address_en
        }
      }));
    }
  }, [isEnglish, businessInfo, open, invoiceNumberFetched]);

  // יצירת קובץ PDF מהחשבונית
  const generatePDF = async () => {
    if (!invoiceContentRef.current) {
      console.error('בעיה: invoiceContentRef.current הוא null');
      return null;
    }
    
    console.log('מתחיל תהליך יצירת PDF');
    console.log('תוכן ה-ref:', invoiceContentRef.current);
    console.log('מידות התוכן:', invoiceContentRef.current.getBoundingClientRect());

    setIsLoading(true);
    try {
      // מוסיף סגנון מיוחד לחשבונית בעת המרה ל-PDF
      const printStyles = document.createElement('style');
      printStyles.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content,
          #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        
        #invoice-content * {
          visibility: visible !important;
          opacity: 1 !important;
          color: #000 !important;
          background-color: #fff;
          font-family: Arial, sans-serif !important;
        }
        
        #invoice-content {
          width: 100% !important;
          height: auto !important;
          min-height: 500px !important;
          overflow: visible !important;
          display: block !important;
          background-color: #fff !important;
          border: 1px solid #ccc !important;
          padding: 20px !important;
          direction: rtl !important;
        }
      `;
      document.head.appendChild(printStyles);

      const content = invoiceContentRef.current;
      console.log('לפני קריאה ל-html2canvas');
      
      // הבאת הרכיב לחזית ומחיקת מחבוא
      content.style.position = "relative";
      content.style.zIndex = "9999";
      content.style.display = "block";
      content.style.backgroundColor = "#ffffff";
      content.style.opacity = "1";
      content.style.visibility = "visible";
      content.style.border = "1px solid #ccc";
      
      // שיפור איכות התמונה על ידי הגדלת הסקייל והוספת פרמטרים לשיפור רנדור טקסט
      const canvas = await html2canvas(content, {
        scale: 2.0, // הורדת רזולוציה לניסיון פתרון בעיות תאימות
        useCORS: true,
        logging: true, // מפעיל לוגים של html2canvas
        imageTimeout: 15000,
        backgroundColor: '#ffffff',
        allowTaint: true,
        letterRendering: true,
        removeContainer: false,
        foreignObjectRendering: false, // ביטול foreignObject שעלול לגרום לבעיות
        onclone: (clonedDoc) => {
          console.log('בתוך onclone, המסמך המשוכפל:', clonedDoc);
          const clonedContent = clonedDoc.getElementById('invoice-content');
          
          // וידוא שהתוכן המשוכפל נראה
          if (clonedContent) {
            clonedContent.style.visibility = "visible";
            clonedContent.style.display = "block";
            clonedContent.style.width = "800px";
            clonedContent.style.margin = "0 auto";
            clonedContent.style.backgroundColor = "#ffffff";
            clonedContent.style.border = "1px solid #000";
            clonedContent.style.padding = "20px";
            
            // וידוא שכל הטקסט יהיה שחור
            const allElements = clonedContent.querySelectorAll('*');
            allElements.forEach(el => {
              if (el.style) {
                el.style.color = "#000000";
                el.style.visibility = "visible";
                el.style.backgroundColor = "transparent";
                el.style.fontFamily = "Arial, sans-serif";
              }
            });
          }
          
          // שינוי גופנים בעותק המסמך כדי להבטיח רנדור חד יותר
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
              color: #000000 !important;
              font-family: Arial, sans-serif !important;
              visibility: visible !important;
            }
          `;
          clonedDoc.head.appendChild(style);
          return clonedDoc;
        }
      });

      document.head.removeChild(printStyles);
      
      // שחזור הסגנון המקורי
      content.style.position = "";
      content.style.zIndex = "";
      content.style.display = "";
      content.style.backgroundColor = "";
      content.style.visibility = "";
      content.style.opacity = "";
      content.style.border = "";
      
      console.log('הקנבס נוצר:', canvas);
      console.log('גודל הקנבס:', canvas.width, 'x', canvas.height);
      
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('שגיאה: הקנבס בגודל 0, אין תוכן להמרה ל-PDF');
        throw new Error('הקנבס ריק - אין תוכן להמרה ל-PDF');
      }

      // בדיקה אם יש תוכן בקנבס - שמירת הקנבס כתמונה זמנית לבדיקה
      const debugImg = document.createElement('img');
      debugImg.src = canvas.toDataURL();
      debugImg.style.width = '300px';
      debugImg.style.border = '2px solid red';
      document.body.appendChild(debugImg);
      setTimeout(() => document.body.removeChild(debugImg), 5000);
      
      // שימוש באיכות מקסימלית ללא דחיסה עבור PNG
      const imgData = canvas.toDataURL('image/png', 1.0);
      console.log('ה-imgData נוצר, גודל:', imgData.length);
      
      // הגדרות PDF משופרות
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false, // ביטול דחיסה כדי לשמור על איכות
        precision: 16 // דיוק גבוה יותר לפיקסלים
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      console.log('מידות ה-PDF:', pdfWidth, 'x', pdfHeight);
      
      // חישוב יחס גודל אופטימלי
      const contentRatio = canvas.width / canvas.height;
      const pageRatio = pdfWidth / pdfHeight;
      
      let imgWidth, imgHeight;
      
      if (contentRatio > pageRatio) {
        // התמונה רחבה יותר מהדף - נקבע את הרוחב ונחשב את הגובה בהתאם
        imgWidth = pdfWidth;
        imgHeight = pdfWidth / contentRatio;
      } else {
        // התמונה גבוהה יותר או שווה לדף - נקבע את הגובה ונחשב את הרוחב בהתאם
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * contentRatio;
      }
      
      console.log('מידות התמונה ב-PDF:', imgWidth, 'x', imgHeight);
      
      // הוספת התמונה לדף ה-PDF עם איכות גבוהה וללא דחיסה
      console.log('מוסיף תמונה ל-PDF');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'NORMAL');
      console.log('התמונה נוספה ל-PDF');

      // שם קובץ שמשלב את מספר החשבונית והתאריך
      const fileName = `חשבונית-${invoiceData.invoiceNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('הקובץ ייווצר בשם:', fileName);

      return { pdf, fileName, imgData };
    } catch (error) {
      console.error('שגיאה מפורטת ביצירת PDF:', error);
      setSnackbar({
        open: true,
        message: isEnglish ? 'Error generating PDF' : 'שגיאה ביצירת קובץ PDF',
        severity: 'error'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // טיפול בשמירת החשבונית
  const handleSave = async () => {
    setIsLoading(true);
    let pdfResult = null;
    
    try {
      // בדיקת תקינות נתונים לפני שליחה
      if (!invoiceData.customer || !invoiceData.customer.name) {
        throw new Error(isEnglish ? 'Customer details are required' : 'פרטי הלקוח הינם שדות חובה');
      }
      
      if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
        throw new Error(isEnglish ? 'At least one item is required' : 'יש להוסיף לפחות פריט אחד');
      }
      
      // בניית אובייקט החשבונית במבנה הנדרש עבור השרת
      const invoiceDataToSend = {
        invoiceNumber: invoiceData.invoiceNumber,
        issueDate: new Date().toISOString(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        status: 'active',
        paymentStatus: 'unpaid',
        paymentMethod: invoiceData.paymentMethod || 'cash',
        location: invoiceData.location || 'rothschild', // וודא שמידע המיקום נשלח לשרת
        businessInfo: {
          name: businessInfo.name,
          name_en: businessInfo.name_en,
          // בחירת הכתובת בהתאם למיקום
          address: getBusinessInfoForLocation(invoiceData.location || 'rothschild').address,
          address_en: getBusinessInfoForLocation(invoiceData.location || 'rothschild').address_en,
          phone: businessInfo.phone,
          email: businessInfo.email,
          website: businessInfo.website,
          taxId: businessInfo.taxId,
        },
        customer: {
          name: invoiceData.customer.name,
          email: invoiceData.customer.email,
          phone: invoiceData.customer.phone,
          address: invoiceData.customer.address,
          city: invoiceData.customer.city || '',
          taxId: invoiceData.customer.identifier || '',
        },
        items: invoiceData.items.map(item => ({
          description: item.description,
          description_en: item.description_en || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
        taxRate: invoiceData.taxRate,
          totalPrice: parseFloat((item.quantity * item.unitPrice).toFixed(2)),
          dateRange: item.dateRange || '',
          dateRange_en: item.dateRange_en || ''
        })),
        subtotal: parseFloat(invoiceData.subtotal) || 0,
        taxRate: parseFloat(invoiceData.taxRate) || 17,
        taxAmount: parseFloat(invoiceData.taxAmount) || 0,
        total: parseFloat(invoiceData.total) || 0,
        notes: invoiceData.notes || '',
        documentType: invoiceData.documentType || 'invoice',
        language: isEnglish ? 'en' : 'he',
      };
      
      // נבדוק שיש סכום תקין לחשבונית
      if (invoiceDataToSend.total <= 0) {
        throw new Error(isEnglish ? 'Invoice total amount must be greater than zero' : 'סכום החשבונית חייב להיות גדול מאפס');
      }

      // מזהה ההזמנה יועבר כפרמטר נפרד
      const bookingId = bookingData?._id || null;
      
      if (bookingId) {
        logService.info('מקשר חשבונית להזמנה ID:', bookingId);
      }
      
      logService.info('שולח נתוני חשבונית:', invoiceDataToSend);
      
      // שליחת החשבונית לשרת באמצעות שירות החשבוניות
      const invoice = await invoiceService.createInvoice(invoiceDataToSend, bookingId);
      
      logService.info('חשבונית נשמרה בהצלחה:', invoice);
      
      // עדכון מצב החשבונית כשמורה
      setInvoiceSaved(true);
      setSavedInvoiceId(invoice._id);
      
      // יצירת קובץ PDF
      pdfResult = await generatePDF();
      logService.info('PDF נוצר בהצלחה');
      
      if (!pdfResult) {
        throw new Error(isEnglish ? 'Error creating PDF file' : 'שגיאה ביצירת קובץ PDF');
      }
      
      const { pdf, fileName } = pdfResult;
      
      // קודם כל שומרים את הקובץ מקומית!
      pdf.save(fileName);
      enqueueSnackbar(
        isEnglish 
          ? 'PDF saved locally successfully' 
          : 'קובץ ה-PDF נשמר מקומית בהצלחה',
        { variant: 'success' }
      );
      
      // יצירת אובייקט FormData לשליחת הקובץ
      const pdfBlob = pdf.output('blob');
      const fileSize = pdfBlob.size / (1024 * 1024); // גודל ב-MB
      
      // רק אם הקובץ מספיק קטן, ננסה להעלות אותו לשרת
      if (fileSize <= 5) { // מגבילים ל-5MB לוודא שזה עובר
        try {
      const formData = new FormData();
      formData.append('pdf', pdfBlob, fileName);
      
      await axios.post(`/api/invoices/${invoice._id}/pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
          logService.info('PDF נשלח לשרת בהצלחה');
        } catch (pdfError) {
          logService.error('שגיאה בשליחת ה-PDF לשרת:', pdfError);
          enqueueSnackbar(
            isEnglish 
              ? 'Error uploading PDF to server, but it was saved locally' 
              : 'שגיאה בהעלאת ה-PDF לשרת, אך הוא נשמר מקומית',
            { variant: 'warning' }
          );
        }
      } else {
        // הקובץ גדול מדי, מדווחים שהוא נשמר מקומית בלבד
        enqueueSnackbar(
          isEnglish 
            ? 'PDF file too large for server upload, saved locally only' 
            : 'קובץ ה-PDF גדול מדי לשרת, נשמר מקומית בלבד',
          { variant: 'info' }
        );
      }
      
      // הצגת הודעת הצלחה
      enqueueSnackbar(
        isEnglish 
          ? `Invoice #${invoice.invoiceNumber} saved successfully` 
          : `חשבונית מספר ${invoice.invoiceNumber} נשמרה בהצלחה`,
        { variant: 'success' }
      );
      
      if (onSave && typeof onSave === 'function') {
        onSave(invoice);
      }
      
    } catch (error) {
      logService.error('שגיאה בשמירת החשבונית:', error);
      
      // במקרה של שגיאה, ננסה עדיין לשמור את החשבונית מקומית בלבד
      try {
        if (pdfResult) {
          pdfResult.pdf.save(pdfResult.fileName);
          enqueueSnackbar(
            isEnglish 
              ? 'Server error: Invoice downloaded locally instead' 
              : 'שגיאת שרת: החשבונית הורדה באופן מקומי במקום',
            { variant: 'warning' }
          );
        }
      } catch (saveError) {
        logService.error('שגיאה גם בהורדה מקומית:', saveError);
      }
      
      enqueueSnackbar(
        isEnglish 
          ? 'An error occurred while saving the invoice: ' + (error.response?.data?.error || error.message)
          : 'אירעה שגיאה בשמירת החשבונית: ' + (error.response?.data?.error || error.message),
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // טיפול בהורדת PDF בלבד
  const handleDownloadPdf = async () => {
    setIsLoading(true);
    try {
      // יצירת קובץ PDF
      const pdfResult = await generatePDF();
      
      if (pdfResult) {
        const { pdf, fileName } = pdfResult;
        // הורדת הקובץ
        pdf.save(fileName);
        
        enqueueSnackbar(
          isEnglish ? 'PDF downloaded successfully' : 'ה-PDF הורד בהצלחה',
          { variant: 'success' }
        );
      }
    } catch (error) {
      console.error('שגיאה בהורדת PDF:', error);
      
      enqueueSnackbar(
        isEnglish ? 'Error downloading PDF' : 'שגיאה בהורדת ה-PDF',
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // סגירת התראה
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // פונקציה לפורמט הצגת מספרים עם 2 ספרות עשרוניות
  const formatPrice = (price) => {
    return price?.toFixed(2) || "0.00";
  };
  
  // החלפת שפת החשבונית
  const handleLanguageToggle = () => {
    setIsEnglish(!isEnglish);
  };
  
  // עדכון סוג המסמך
  const handleDocumentTypeChange = (event) => {
    const documentType = event.target.value;
    
    // אם נבחר אישור הזמנה, פתח את הדיאלוג המתאים
    if (documentType === 'booking_confirmation') {
      setBookingConfirmationOpen(true);
      onClose(); // סגור את דיאלוג החשבונית
    } else {
      setInvoiceData(prev => ({
        ...prev,
        documentType
      }));
    }
  };
  
  // עדכון אמצעי תשלום
  const handlePaymentMethodChange = (event) => {
    setInvoiceData(prev => ({
      ...prev,
      paymentMethod: event.target.value
    }));
  };

  // הכותרת המתאימה לסוג המסמך
  const getDocumentTitle = () => {
    if (isEnglish) {
      if (invoiceData.documentType === 'invoice_receipt') 
        return 'Tax Invoice / Receipt - Original';
      else if (invoiceData.documentType === 'booking_confirmation')
        return 'Booking Confirmation';
      else 
        return 'Tax Invoice - Original';
    } else {
      if (invoiceData.documentType === 'invoice_receipt') 
        return 'חשבונית מס/קבלה - מקור';
      else if (invoiceData.documentType === 'booking_confirmation')
        return 'אישור הזמנה';
      else 
        return 'חשבונית מס - מקור';
    }
  };

  // קביעת פרטי העסק בהתאם למיקום
  const getBusinessInfoForLocation = (location) => {
    const locationInfo = location === 'airport' ? {
      address: "הארז 12, אור יהודה",
      address_en: "12 HaErez St., Or Yehuda"
    } : {
      address: "רוטשילד 79, פתח תקווה",
      address_en: "Rothschild St., Petah Tikva 79"
    };
    
    return {
      ...businessInfo,
      address: locationInfo.address,
      address_en: locationInfo.address_en
    };
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: style.borderRadius,
            boxShadow: style.boxShadow,
            width: '100%',
            maxWidth: '800px'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${accentColors.border}`,
            bgcolor: accentColors.light,
            color: accentColors.primary,
            px: 3,
            py: 1
          }}
        >
          <IconButton onClick={onClose} size="small" sx={{ color: accentColors.error }}>
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={isEnglish}
                  onChange={handleLanguageToggle}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TranslateIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">
                    {isEnglish ? 'English' : 'עברית'}
                  </Typography>
                </Box>
              }
              labelPlacement="start"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptIcon sx={{ mr: 1 }} />
              {isEnglish ? 'Create Invoice' : 'יצירת חשבונית'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* פאנל הגדרות */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: style.borderRadius, boxShadow: 'none', border: `1px solid ${accentColors.border}` }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{isEnglish ? 'Document Type' : 'סוג מסמך'}</InputLabel>
                <Select
                  value={invoiceData.documentType}
                  onChange={handleDocumentTypeChange}
                  label={isEnglish ? 'Document Type' : 'סוג מסמך'}
                >
                  <MenuItem value="invoice">{isEnglish ? 'Tax Invoice' : 'חשבונית מס'}</MenuItem>
                  <MenuItem value="invoice_receipt">{isEnglish ? 'Tax Invoice/Receipt' : 'חשבונית מס/קבלה'}</MenuItem>
                  <MenuItem value="booking_confirmation">{isEnglish ? 'Booking Confirmation' : 'אישור הזמנה'}</MenuItem>
                </Select>
              </FormControl>
              
              {invoiceData.documentType === 'invoice_receipt' && (
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>{isEnglish ? 'Payment Method' : 'אמצעי תשלום'}</InputLabel>
                  <Select
                    value={invoiceData.paymentMethod}
                    onChange={handlePaymentMethodChange}
                    label={isEnglish ? 'Payment Method' : 'אמצעי תשלום'}
                  >
                    <MenuItem value="cash">{isEnglish ? 'Cash' : 'מזומן'}</MenuItem>
                    <MenuItem value="credit_card">{isEnglish ? 'Credit Card' : 'כרטיס אשראי'}</MenuItem>
                    <MenuItem value="bank_transfer">{isEnglish ? 'Bank Transfer' : 'העברה בנקאית'}</MenuItem>
                    <MenuItem value="check">{isEnglish ? 'Check' : 'צ\'ק'}</MenuItem>
                    <MenuItem value="other">{isEnglish ? 'Other' : 'אחר'}</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Paper>
        
          <div ref={invoiceContentRef} id="invoice-content">
            {/* ראש החשבונית - פרטי עסק */}
            <Paper 
              sx={{ 
                p: 0, 
                mb: 3, 
                borderRadius: style.borderRadius, 
                boxShadow: 'none',
                border: `1px solid ${accentColors.border}`,
                overflow: 'hidden'
              }}
            >
              {/* כותרת עליונה */}
              <Box 
                sx={{ 
                  bgcolor: accentColors.light, 
                  p: 3, 
                  color: accentColors.dark,
                  textAlign: 'center',
                  borderBottom: `1px solid ${accentColors.border}`
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {isEnglish ? businessInfo.name_en : businessInfo.name}
                </Typography>
                <Typography variant="body2">
                  {isEnglish 
                    ? getBusinessInfoForLocation(invoiceData.location || (bookingData?.location || 'rothschild')).address_en 
                    : getBusinessInfoForLocation(invoiceData.location || (bookingData?.location || 'rothschild')).address
                  }
                </Typography>
                <Typography variant="body2">
                  {isEnglish ? 'Tax ID: ' : 'ח.פ: '}{businessInfo.taxId}
                </Typography>
              </Box>
              
              {/* מידע חשבונית */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'white' }}>
                {isEnglish ? (
                  <>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: accentColors.dark }}>
                        Invoice Number: 
                        <Box component="span" sx={{ color: accentColors.dark, ml: 1, fontWeight: 'normal' }}>
                          {invoiceData.invoiceNumber || 'Will be generated'}
                        </Box>
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, color: accentColors.dark }}>
                        Date: 
                        <Box component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                          {new Date(invoiceData.issueDate).toLocaleDateString('en-US')}
                        </Box>
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, color: accentColors.dark }}>
                        תאריך: 
                        <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                          {new Date(invoiceData.issueDate).toLocaleDateString('he-IL')}
                        </Box>
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: accentColors.dark }}>
                        מספר חשבונית: 
                        <Box component="span" sx={{ color: accentColors.dark, mr: 1, fontWeight: 'normal' }}>
                          {invoiceData.invoiceNumber || 'יופק אוטומטית'}
                        </Box>
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>

            <Paper 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: style.borderRadius, 
                boxShadow: 'none',
                border: `1px solid ${accentColors.border}`,
                position: 'relative'
              }}
            >            
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 3, 
                  textAlign: 'center',
                  color: accentColors.primary,
                  borderBottom: `1px solid ${accentColors.border}`,
                  pb: 2
                }}
              >
                {getDocumentTitle()}
              </Typography>
              
              <Box 
                sx={{ 
                  mb: 3, 
                  p: 2,
                  border: `1px solid ${accentColors.border}`,
                  borderRadius: '4px',
                  bgcolor: accentColors.light,
                  textAlign: isEnglish ? 'left' : 'right'
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1, 
                    color: accentColors.dark,
                    fontWeight: 'bold'
                  }}
                >
                  {isEnglish ? 'To:' : 'לכבוד:'}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {invoiceData.customer.name || (isEnglish ? 'Customer Name' : 'שם הלקוח')}
                </Typography>
                {invoiceData.customer.identifier && (
                  <Typography variant="body2">
                    {isEnglish ? 'ID/Business ID: ' : 'ת.ז/ח.פ: '}{invoiceData.customer.identifier}
                  </Typography>
                )}
                {invoiceData.customer.address && (
                  <Typography variant="body2">
                    {isEnglish ? 'Address: ' : 'כתובת: '}{invoiceData.customer.address}
                  </Typography>
                )}
                {invoiceData.customer.email && (
                  <Typography variant="body2">
                    {isEnglish ? 'Email: ' : 'דוא"ל: '}{invoiceData.customer.email}
                  </Typography>
                )}
              </Box>

              {/* טבלת פריטים */}
              <TableContainer sx={{ mb: 3, border: `1px solid ${accentColors.border}`, borderRadius: '4px', overflow: 'hidden' }}>
                {isEnglish ? (
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: accentColors.light }}>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>Total</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>Price per Night</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>Nights</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>Dates</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceData.items.map((item, index) => (
                        <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.02)' } }}>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                            ₪{formatPrice(item.totalPrice)}
                          </TableCell>
                          <TableCell align="center">
                            ₪{formatPrice(item.unitPrice)}
                          </TableCell>
                          <TableCell align="center">
                            {item.quantity || 1}
                          </TableCell>
                          <TableCell align="center">
                            {item.dateRange_en || '04/28/2025 - 04/27/2025'}
                          </TableCell>
                          <TableCell align="center">
                            {item.description_en || 'Accommodation'} - {item.roomType_en || 'Room'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: accentColors.light }}>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>תיאור</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>תאריכים</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>לילות</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>מחיר ללילה</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: accentColors.dark }}>סה"כ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoiceData.items.map((item, index) => (
                        <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.02)' } }}>
                          <TableCell align="center">
                            {item.description || 'לינה'} - {item.roomType || 'חדר'}
                          </TableCell>
                          <TableCell align="center">
                            {item.dateRange || '28/04/2025 - 27/04/2025'}
                          </TableCell>
                          <TableCell align="center">
                            {item.quantity || 1}
                          </TableCell>
                          <TableCell align="center">
                            ₪{formatPrice(item.unitPrice)}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                            ₪{formatPrice(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>

              {/* סיכום חשבונית */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Box 
                  sx={{ 
                    width: '250px', 
                    border: `1px solid ${accentColors.border}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      p: 1.5,
                      bgcolor: accentColors.light
                    }}
                  >
                    <Typography variant="body1">{isEnglish ? 'Subtotal:' : 'סכום לפני מע"מ:'}</Typography>
                    <Typography variant="body1">₪{formatPrice(invoiceData.subtotal)}</Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      p: 1.5
                    }}
                  >
                    <Typography variant="body1">{isEnglish ? `VAT (${invoiceData.taxRate}%):` : `מע"מ (${invoiceData.taxRate}%):`}</Typography>
                    <Typography variant="body1">₪{formatPrice(invoiceData.taxAmount)}</Typography>
                  </Box>
                  {invoiceData.discount > 0 && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        p: 1.5,
                        bgcolor: 'rgba(40, 167, 69, 0.05)'
                      }}
                    >
                      <Typography variant="body1">{isEnglish ? 'Discount:' : 'הנחה:'}</Typography>
                      <Typography variant="body1" sx={{ color: accentColors.success }}>-₪{formatPrice(invoiceData.discount)}</Typography>
                    </Box>
                  )}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      p: 1.5,
                      borderTop: `1px solid ${accentColors.border}`,
                      bgcolor: accentColors.light,
                      fontWeight: 'bold'
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{isEnglish ? 'Total:' : 'סה"כ לתשלום:'}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₪{formatPrice(invoiceData.total)}</Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* הערות */}
              {invoiceData.notes && (
                <Box sx={{ mt: 2, p: 2, borderTop: '1px dashed #ddd' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {isEnglish ? 'Notes:' : 'הערות:'}
                  </Typography>
                  <Typography variant="body2">{invoiceData.notes}</Typography>
                </Box>
              )}
              
              {/* פרטי תשלום - ממוקם בפינה התחתונה - מוצג רק אם זו חשבונית מס/קבלה */}
              {invoiceData.documentType === 'invoice_receipt' && (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    bottom: '20px',
                    left: isEnglish ? '20px' : 'auto',
                    right: isEnglish ? 'auto' : '20px',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    backgroundColor: 'white',
                    border: `1px solid ${accentColors.border}`,
                    textAlign: isEnglish ? 'left' : 'right',
                    minWidth: '150px',
                    zIndex: 2
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {isEnglish ? 'Payment Method: ' : 'אמצעי תשלום: '}
                    <Box component="span" sx={{ fontWeight: 'normal' }}>
                    {isEnglish 
                      ? {'cash': 'Cash', 'credit_card': 'Credit Card', 'bank_transfer': 'Bank Transfer', 'check': 'Check', 'other': 'Other'}[invoiceData.paymentMethod] 
                      : {'cash': 'מזומן', 'credit_card': 'כרטיס אשראי', 'bank_transfer': 'העברה בנקאית', 'check': 'צ\'ק', 'other': 'אחר'}[invoiceData.paymentMethod]
                    }
                    </Box>
                  </Typography>
                </Box>
              )}
            </Paper>
          </div>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${accentColors.border}` }}>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            {/* כפתור שמירה */}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isLoading}
              sx={{
                bgcolor: accentColors.accent,
                color: 'white',
                '&:hover': { bgcolor: '#0069d9' }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : isEnglish ? 'Save Invoice' : 'שמור חשבונית'}
            </Button>
            
            {/* כפתור הורדת PDF - מותנה בשמירת החשבונית */}
            <Tooltip title={invoiceSaved ? '' : (isEnglish ? 'Save the invoice first' : 'יש לשמור את החשבונית תחילה')}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handleDownloadPdf}
                  disabled={isLoading || !invoiceSaved}
                  sx={{ color: accentColors.accent, borderColor: accentColors.accent }}
                >
                  {isEnglish ? 'Download PDF' : 'הורד PDF'}
                </Button>
              </span>
            </Tooltip>
            
            {/* כפתור ביטול */}
            <Button
              variant="outlined"
              onClick={() => {
                setInvoiceSaved(false);
                setSavedInvoiceId(null);
                onClose();
              }}
              disabled={isLoading}
              sx={{ color: accentColors.error, borderColor: accentColors.error }}
            >
              {isEnglish ? 'Cancel' : 'ביטול'}
            </Button>
          </Box>
        </DialogActions>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Dialog>

      {/* דיאלוג אישור הזמנה */}
      <BookingConfirmation
        open={bookingConfirmationOpen}
        onClose={() => setBookingConfirmationOpen(false)}
        bookingData={bookingData}
      />
    </>
  );
};

export default CreateInvoiceDialog; 