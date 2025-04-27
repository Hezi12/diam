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
  InputLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Translate as TranslateIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { useSnackbar } from 'notistack';

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
    phone: "03-1234567",
    email: "info@diamhotels.co.il",
    website: "www.diamhotels.co.il",
    taxId: "516679909"
  }
}) => {
  // סטייל בסיסי
  const style = {
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  // צבעי אקסנט
  const accentColors = {
    green: '#06a271',
    red: '#e34a6f',
    blue: '#0071e3',
    orange: '#f7971e'
  };
  
  // מצב שפת החשבונית (עברית/אנגלית)
  const [isEnglish, setIsEnglish] = useState(false);

  // הוק להודעות מערכת
  const { enqueueSnackbar } = useSnackbar();

  // מצב החשבונית
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    documentType: 'invoice', // חשבונית מס, חשבונית מס/קבלה
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

  // יצירת קובץ PDF מהחשבונית
  const generatePDF = async () => {
    if (!invoiceContentRef.current) return null;

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
      `;
      document.head.appendChild(printStyles);

      const content = invoiceContentRef.current;
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      document.head.removeChild(printStyles);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // שם קובץ שמשלב את מספר החשבונית והתאריך
      const fileName = `חשבונית-${invoiceData.invoiceNumber}-${new Date().toISOString().split('T')[0]}.pdf`;

      return { pdf, fileName, imgData };
    } catch (error) {
      console.error('שגיאה ביצירת PDF:', error);
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

  // שמירת החשבונית בשרת
  const handleSave = async () => {
    setIsLoading(true);
    let pdfResult = null;
    
    try {
      // יצירת קובץ PDF
      pdfResult = await generatePDF();
      
      if (!pdfResult) {
        throw new Error(isEnglish ? 'Error creating PDF file' : 'שגיאה ביצירת קובץ PDF');
      }
      
      const { pdf, fileName } = pdfResult;
      
      // יצירת אובייקט FormData לשליחת הקובץ
      const pdfBlob = pdf.output('blob');
      
      // שליחת הנתונים לשרת
      const invoiceDataToSend = {
        documentType: invoiceData.documentType,
        customer: invoiceData.customer,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        taxRate: invoiceData.taxRate,
        taxAmount: invoiceData.taxAmount,
        discount: invoiceData.discount,
        total: invoiceData.total,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        notes: invoiceData.notes,
        paymentMethod: invoiceData.paymentMethod,
        paymentDetails: invoiceData.paymentDetails,
        business: businessInfo
      };
      
      // אם יש הזמנה קשורה, מוסיף את המזהה שלה
      if (bookingData && bookingData._id) {
        invoiceDataToSend.booking = bookingData._id;
      }
      
      // שליחת נתוני החשבונית לשרת
      const response = await axios.post('/api/invoices', {
        invoiceData: invoiceDataToSend,
        bookingId: bookingData?._id
      });
      
      // קבלת מזהה החשבונית שנוצרה
      const { invoice } = response.data;
      
      // העלאת קובץ ה-PDF לשרת
      const formData = new FormData();
      formData.append('pdf', pdfBlob, fileName);
      
      await axios.post(`/api/invoices/${invoice._id}/pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // שמירת הקובץ לוקאלית
      pdf.save(fileName);
      
      // קריאה לפונקציית השמירה החיצונית אם קיימת
      if (onSave && typeof onSave === 'function') {
        onSave(invoice);
      }
      
      // הצגת הודעת הצלחה
      enqueueSnackbar(
        isEnglish ? 'Invoice saved successfully' : 'החשבונית נשמרה בהצלחה',
        { variant: 'success' }
      );
      
      // סגירת הדיאלוג
      onClose();
    } catch (error) {
      console.error('שגיאה בשמירת החשבונית:', error);
      
      // במקרה של שגיאה, נשמור את החשבונית מקומית בלבד
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
        console.error('שגיאה גם בהורדה מקומית:', saveError);
      }
      
      enqueueSnackbar(
        isEnglish 
          ? 'An error occurred while saving the invoice' 
          : 'אירעה שגיאה בשמירת החשבונית: ' + (error.response?.data?.message || error.message),
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
    setInvoiceData(prev => ({
      ...prev,
      documentType: event.target.value
    }));
  };
  
  // עדכון פרטי לקוח
  const handleCustomerChange = (field) => (event) => {
    setInvoiceData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: event.target.value
      }
    }));
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
      return invoiceData.documentType === 'invoice_receipt' 
        ? 'Tax Invoice / Receipt - Original' 
        : 'Tax Invoice - Original';
    } else {
      return invoiceData.documentType === 'invoice_receipt' 
        ? 'חשבונית מס/קבלה - מקור' 
        : 'חשבונית מס - מקור';
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
          borderBottom: `1px solid ${accentColors.blue}`,
          bgcolor: 'rgba(0, 113, 227, 0.08)',
          color: accentColors.blue,
          px: 3,
          py: 1
        }}
      >
        <IconButton onClick={onClose} size="small" sx={{ color: accentColors.red }}>
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
        <Paper sx={{ p: 2, mb: 3, borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
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
              </Select>
            </FormControl>
            
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
            
            <TextField
              label={isEnglish ? 'Customer ID/Business ID' : 'ת.ז/ח.פ'}
              variant="outlined"
              size="small"
              value={invoiceData.customer.identifier}
              onChange={handleCustomerChange('identifier')}
              sx={{ minWidth: 200 }}
            />
            
            <TextField
              label={isEnglish ? 'Customer Address' : 'כתובת'}
              variant="outlined"
              size="small"
              value={invoiceData.customer.address}
              onChange={handleCustomerChange('address')}
              sx={{ minWidth: 200, flexGrow: 1 }}
            />
          </Box>
        </Paper>
      
        <div ref={invoiceContentRef} id="invoice-content">
          {/* ראש החשבונית - פרטי עסק */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {isEnglish ? businessInfo.name_en : businessInfo.name}
              </Typography>
              <Typography variant="body2">{isEnglish ? businessInfo.address_en : businessInfo.address}</Typography>
              <Typography variant="body2">{isEnglish ? 'Phone: ' : 'טלפון: '}{businessInfo.phone}</Typography>
              <Typography variant="body2">{isEnglish ? 'Email: ' : 'דוא"ל: '}{businessInfo.email}</Typography>
              <Typography variant="body2">{isEnglish ? 'Website: ' : 'אתר: '}{businessInfo.website}</Typography>
              <Typography variant="body2">{isEnglish ? 'Tax ID: ' : 'ח.פ/ע.מ: '}{businessInfo.taxId}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              {isEnglish ? (
                <>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Invoice Number: {invoiceData.invoiceNumber || 'Will be generated'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Date: {new Date(invoiceData.issueDate).toLocaleDateString('en-US')}
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      תאריך: {new Date(invoiceData.issueDate).toLocaleDateString('he-IL')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      מספר חשבונית: {invoiceData.invoiceNumber || 'יופק אוטומטית'}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3, borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
              {getDocumentTitle()}
            </Typography>
            
            <Box sx={{ mb: 3, textAlign: isEnglish ? 'left' : 'right' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
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
              {invoiceData.customer.phone && (
                <Typography variant="body2">
                  {isEnglish ? 'Phone: ' : 'טלפון: '}{invoiceData.customer.phone}
                </Typography>
              )}
              {invoiceData.customer.email && (
                <Typography variant="body2">
                  {isEnglish ? 'Email: ' : 'דוא"ל: '}{invoiceData.customer.email}
                </Typography>
              )}
            </Box>

            {/* טבלת פריטים */}
            <TableContainer>
              {isEnglish ? (
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Price per Night</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Nights</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Dates</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceData.items.map((item, index) => (
                      <TableRow key={index}>
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
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>תיאור</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>תאריכים</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>לילות</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>מחיר ללילה</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>סה"כ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceData.items.map((item, index) => (
                      <TableRow key={index}>
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
              <Box sx={{ width: '250px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">{isEnglish ? 'Subtotal:' : 'סכום לפני מע"מ:'}</Typography>
                  <Typography variant="body1">₪{formatPrice(invoiceData.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">{isEnglish ? `VAT (${invoiceData.taxRate}%):` : `מע"מ (${invoiceData.taxRate}%):`}</Typography>
                  <Typography variant="body1">₪{formatPrice(invoiceData.taxAmount)}</Typography>
                </Box>
                {invoiceData.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">{isEnglish ? 'Discount:' : 'הנחה:'}</Typography>
                    <Typography variant="body1" sx={{ color: accentColors.green }}>-₪{formatPrice(invoiceData.discount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', pt: 1, mt: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{isEnglish ? 'Total:' : 'סה"כ לתשלום:'}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₪{formatPrice(invoiceData.total)}</Typography>
                </Box>
              </Box>
            </Box>
            
            {/* פרטי תשלום */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {isEnglish ? 'Payment Method: ' : 'אמצעי תשלום: '}
                {isEnglish 
                  ? {'cash': 'Cash', 'credit_card': 'Credit Card', 'bank_transfer': 'Bank Transfer', 'check': 'Check', 'other': 'Other'}[invoiceData.paymentMethod] 
                  : {'cash': 'מזומן', 'credit_card': 'כרטיס אשראי', 'bank_transfer': 'העברה בנקאית', 'check': 'צ\'ק', 'other': 'אחר'}[invoiceData.paymentMethod]
                }
              </Typography>
            </Box>
            
            {/* הערות */}
            {invoiceData.notes && (
              <Box sx={{ mt: 2, p: 1, borderTop: '1px dashed #ddd' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {isEnglish ? 'Notes:' : 'הערות:'}
                </Typography>
                <Typography variant="body2">{invoiceData.notes}</Typography>
              </Box>
            )}
            
            {/* חותמת */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                {isEnglish 
                  ? 'This document was created digitally and is valid without signature according to tax authority regulations'
                  : 'מסמך זה הופק באופן ממוחשב והינו תקף ללא חתימה בהתאם לתקנות'
                }
              </Typography>
            </Box>
          </Paper>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #ddd' }}>
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          {/* כפתור שמירה */}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isLoading}
            sx={{
              bgcolor: accentColors.blue,
              color: 'white',
              '&:hover': { bgcolor: '#0058b1' }
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : isEnglish ? 'Save Invoice' : 'שמור חשבונית'}
          </Button>
          
          {/* כפתור הורדת PDF */}
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handleDownloadPdf}
            disabled={isLoading}
            sx={{ color: accentColors.blue, borderColor: accentColors.blue }}
          >
            {isEnglish ? 'Download PDF' : 'הורד PDF'}
          </Button>
          
          {/* כפתור ביטול */}
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isLoading}
            sx={{ color: accentColors.red, borderColor: accentColors.red }}
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
  );
};

export default CreateInvoiceDialog; 