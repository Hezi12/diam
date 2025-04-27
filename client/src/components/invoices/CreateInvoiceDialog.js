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
  Grid,
  TextField,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * דיאלוג יצירת חשבונית
 */
const CreateInvoiceDialog = ({ 
  open, 
  onClose, 
  bookingData, 
  businessInfo = {
    name: "דיאם אירוח בע״מ",
    address: "רחוב רוטשילד 12, תל אביב",
    phone: "03-1234567",
    email: "info@diam.co.il",
    website: "www.diam.co.il",
    taxId: "123456789"
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

  // מצב החשבונית
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    customerEmail: '',
    items: [
      {
        description: 'לינה בדיאם',
        quantity: 1,
        price: 0,
        total: 0
      }
    ],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: '',
    paymentMethod: 'מזומן'
  });

  // מצב טעינה
  const [isLoading, setIsLoading] = useState(false);

  // מצב הדפסה
  const [isPrinting, setIsPrinting] = useState(false);
  
  // מצב התראות
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // רפרנס לתוכן החשבונית
  const invoiceContentRef = useRef(null);

  // יצירת מספר חשבונית אוטומטי
  useEffect(() => {
    if (!invoiceData.invoiceNumber) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // בפרויקט אמיתי נקבל את המספר הרץ מהשרת
      // כאן אנחנו פשוט משתמשים במספר רנדומלי לצורך הדגמה
      const randomNumber = Math.floor(Math.random() * 999) + 1;
      const serialNumber = String(randomNumber).padStart(3, '0');
      
      const autoInvoiceNumber = `${year}-${month}-${serialNumber}`;
      
      setInvoiceData(prev => ({
        ...prev,
        invoiceNumber: autoInvoiceNumber
      }));
    }
  }, [invoiceData.invoiceNumber]);

  // עדכון נתוני החשבונית מנתוני ההזמנה
  useEffect(() => {
    if (bookingData) {
      // חישוב טקסט של מספר לילות
      const nightsText = bookingData.nights === 1 
        ? 'לילה אחד' 
        : `${bookingData.nights} לילות`;

      // חישוב תאריכי שהייה
      const checkInDate = new Date(bookingData.checkIn);
      const checkOutDate = new Date(bookingData.checkOut);
      
      const formattedCheckIn = checkInDate.toLocaleDateString('he-IL');
      const formattedCheckOut = checkOutDate.toLocaleDateString('he-IL');
      
      // תיאור מלא של השירות
      const serviceDescription = `לינה בדיאם - ${nightsText} (${formattedCheckIn} - ${formattedCheckOut})`;
      
      // חישוב סכומים
      const subtotal = bookingData.price || 0;
      const tax = bookingData.isTourist ? 0 : Math.round(subtotal * 0.17);
      const total = subtotal;

      setInvoiceData(prev => ({
        ...prev,
        customerName: `${bookingData.firstName} ${bookingData.lastName}`,
        customerPhone: bookingData.phone || '',
        customerEmail: bookingData.email || '',
        items: [
          {
            description: serviceDescription,
            quantity: bookingData.nights || 1,
            price: bookingData.pricePerNight || 0,
            total: subtotal
          }
        ],
        subtotal: subtotal,
        tax: tax,
        total: total,
        isTourist: bookingData.isTourist || false
      }));
    }
  }, [bookingData]);

  // הוספת פריט לחשבונית
  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [
        ...invoiceData.items,
        {
          description: '',
          quantity: 1,
          price: 0,
          total: 0
        }
      ]
    });
  };

  // עדכון פרטי פריט בחשבונית
  const updateItem = (index, field, value) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;
    
    // אם שינינו כמות או מחיר, נעדכן את הסכום
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price;
    }
    
    // חישוב סיכום מחדש
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = invoiceData.isTourist ? 0 : Math.round(subtotal * 0.17);
    
    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      subtotal: subtotal,
      tax: tax,
      total: subtotal
    });
  };

  // מחיקת פריט מהחשבונית
  const removeItem = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    
    // חישוב סיכום מחדש
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = invoiceData.isTourist ? 0 : Math.round(subtotal * 0.17);
    
    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      subtotal: subtotal,
      tax: tax,
      total: subtotal
    });
  };

  // הדפסת החשבונית
  const handlePrint = () => {
    setIsPrinting(true);
    
    // הדפסה באמצעות דפדפן
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

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
      
      // הגדרת אפשרויות של html2canvas
      const options = {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      };

      // יצירת תמונה מהתוכן
      const canvas = await html2canvas(invoiceContentRef.current, options);
      
      // מחיקת סגנון ההדפסה
      document.head.removeChild(printStyles);
      
      const imgData = canvas.toDataURL('image/png');

      // יצירת PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // חישוב יחס הגובה/רוחב של התמונה
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      // מיקום והוספת התמונה ל-PDF
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);

      // שם הקובץ
      const fileName = `חשבונית_${invoiceData.invoiceNumber || 'חדשה'}_${invoiceData.customerName.replace(/\s+/g, '_')}.pdf`;
      
      return { pdf, fileName };
    } catch (error) {
      console.error('שגיאה ביצירת PDF:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // שמירת החשבונית
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // יצירת קובץ PDF
      const pdfResult = await generatePDF();
      
      if (pdfResult) {
        const { pdf, fileName } = pdfResult;
        
        // הורדת הקובץ
        pdf.save(fileName);
        
        // הצגת הודעת הצלחה
        setSnackbar({
          open: true,
          message: 'החשבונית נשמרה בהצלחה',
          severity: 'success'
        });
      } else {
        throw new Error('שגיאה ביצירת קובץ PDF');
      }
    } catch (error) {
      console.error('שגיאה בשמירת החשבונית:', error);
      setSnackbar({
        open: true,
        message: 'אירעה שגיאה בשמירת החשבונית',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // סגירת התראה
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ReceiptIcon sx={{ mr: 1 }} />
          <Typography variant="h6">יצירת חשבונית</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: accentColors.red }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <div ref={invoiceContentRef} id="invoice-content">
          {/* ראש החשבונית - פרטי עסק */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {businessInfo.name}
                </Typography>
                <Typography variant="body2">{businessInfo.address}</Typography>
                <Typography variant="body2">טלפון: {businessInfo.phone}</Typography>
                <Typography variant="body2">מייל: {businessInfo.email}</Typography>
                <Typography variant="body2">ע.מ/ח.פ: {businessInfo.taxId}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    חשבונית מס/קבלה
                  </Typography>
                  <TextField
                    label="מספר חשבונית"
                    variant="outlined"
                    size="small"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                    sx={{ mb: 1, width: '150px' }}
                  />
                  <TextField
                    label="תאריך הוצאה"
                    type="date"
                    variant="outlined"
                    size="small"
                    value={invoiceData.issueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
                    sx={{ mb: 1, width: '150px' }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* פרטי לקוח */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              פרטי לקוח
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="שם הלקוח"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={invoiceData.customerName}
                  onChange={(e) => setInvoiceData({ ...invoiceData, customerName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="כתובת"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={invoiceData.customerAddress}
                  onChange={(e) => setInvoiceData({ ...invoiceData, customerAddress: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="טלפון"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={invoiceData.customerPhone}
                  onChange={(e) => setInvoiceData({ ...invoiceData, customerPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="דוא״ל"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={invoiceData.customerEmail}
                  onChange={(e) => setInvoiceData({ ...invoiceData, customerEmail: e.target.value })}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* טבלת פריטים */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              פירוט שירותים
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>תיאור</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>כמות</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>מחיר</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>סה״כ</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          variant="outlined"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          InputProps={{ inputProps: { min: 1 } }}
                          sx={{ width: '70px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          variant="outlined"
                          size="small"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₪</InputAdornment>
                          }}
                          sx={{ width: '120px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ₪{item.total}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removeItem(index)}
                          sx={{ color: accentColors.red }}
                          disabled={invoiceData.items.length === 1}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={addItem}
                sx={{ 
                  borderColor: accentColors.blue, 
                  color: accentColors.blue,
                  '&:hover': { borderColor: accentColors.blue, opacity: 0.8 }  
                }}
              >
                הוספת פריט
              </Button>
            </Box>
          </Paper>

          {/* סיכום ואפשרויות נוספות */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  אמצעי תשלום והערות
                </Typography>
                <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                  <InputLabel>אמצעי תשלום</InputLabel>
                  <Select
                    value={invoiceData.paymentMethod}
                    onChange={(e) => setInvoiceData({ ...invoiceData, paymentMethod: e.target.value })}
                    label="אמצעי תשלום"
                  >
                    <MenuItem value="מזומן">מזומן</MenuItem>
                    <MenuItem value="אשראי">כרטיס אשראי</MenuItem>
                    <MenuItem value="העברה בנקאית">העברה בנקאית</MenuItem>
                    <MenuItem value="ביט">ביט</MenuItem>
                    <MenuItem value="פייבוקס">פייבוקס</MenuItem>
                    <MenuItem value="אחר">אחר</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="הערות"
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: style.borderRadius, boxShadow: style.boxShadow }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  סיכום
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>סכום ביניים:</Typography>
                  <Typography>₪{invoiceData.subtotal}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>מע״מ ({invoiceData.isTourist ? 'פטור - תייר' : '17%'}):</Typography>
                  <Typography>₪{invoiceData.tax}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>הנחה:</Typography>
                  <TextField
                    type="number"
                    variant="outlined"
                    size="small"
                    value={invoiceData.discount}
                    onChange={(e) => {
                      const discount = Number(e.target.value);
                      setInvoiceData({
                        ...invoiceData,
                        discount: discount,
                        total: invoiceData.subtotal - discount
                      });
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₪</InputAdornment>
                    }}
                    sx={{ width: '120px' }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    p: 2,
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  <Typography variant="h6">סה״כ לתשלום:</Typography>
                  <Typography variant="h6">₪{invoiceData.total - invoiceData.discount}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={isPrinting}
        >
          {isPrinting ? <CircularProgress size={24} /> : 'הדפסה'}
        </Button>
        <Box>
          <Button onClick={onClose} sx={{ mx: 1 }}>
            ביטול
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            disabled={isLoading}
            sx={{ bgcolor: accentColors.green, '&:hover': { bgcolor: '#058c61' } }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'שמירה כ-PDF'}
          </Button>
        </Box>
      </DialogActions>

      {/* התראות */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CreateInvoiceDialog; 