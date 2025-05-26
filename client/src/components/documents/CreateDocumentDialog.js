/**
 * דיאלוג ליצירת מסמכים מתוך הזמנה (חשבוניות, חשבוניות-קבלה, אישורי הזמנה)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  CircularProgress,
  Box,
  Alert,
  AlertTitle,
  Chip
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  FileDownload as FileDownloadIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import documentService from '../../services/documentService';
import axios from 'axios';
import BookingConfirmationView from './BookingConfirmationView';

const CreateDocumentDialog = ({ open, onClose, booking }) => {
  // מצב סוג המסמך
  const [documentType, setDocumentType] = useState('invoice');
  
  // מצב טעינה ותוצאות
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [existingInvoices, setExistingInvoices] = useState([]); // מערך של כל החשבוניות הקיימות
  const [initialLoading, setInitialLoading] = useState(true);
  
  // מצב תצוגת אישור הזמנה
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // הוק להודעות
  const { enqueueSnackbar } = useSnackbar();
  
  // בדיקה ראשונית בעת פתיחת הדיאלוג אם כבר קיימת חשבונית
  useEffect(() => {
    if (open && booking && booking._id) {
      checkIfInvoiceExists();
    }
  }, [open, booking]);
  
  // בדיקה אם קיימת חשבונית להזמנה
  const checkIfInvoiceExists = async () => {
    if (!booking || !booking._id) return;
    
    setInitialLoading(true);
    
    try {
      // שליחת בקשה לשרת לבדוק אם קיימות חשבוניות להזמנה
      const response = await axios.get(`/api/documents/check-booking/${booking._id}`);
      
      if (response.data.exists && response.data.invoices) {
        // אם החזירו מערך של חשבוניות
        setExistingInvoices(Array.isArray(response.data.invoices) ? response.data.invoices : [response.data.invoices]);
        
        // בחירת ברירת מחדל - אם יש חשבונית רגילה, נבחר חשבונית מס/קבלה
        const hasInvoice = response.data.invoices.some(inv => inv.documentType === 'invoice');
        const hasInvoiceReceipt = response.data.invoices.some(inv => inv.documentType === 'invoice_receipt');
        
        if (hasInvoice && !hasInvoiceReceipt) {
          setDocumentType('invoice_receipt');
        } else if (!hasInvoice && hasInvoiceReceipt) {
          setDocumentType('invoice');
        } else if (hasInvoice && hasInvoiceReceipt) {
          setDocumentType('confirmation'); // אם יש את שניהם, נבחר אישור הזמנה
        }
      } else if (response.data.exists && response.data.invoice) {
        // תמיכה לאחור - אם החזירו חשבונית יחידה
        setExistingInvoices([response.data.invoice]);
        
        if (response.data.invoice.documentType === 'invoice') {
          setDocumentType('invoice_receipt');
        }
      } else {
        setExistingInvoices([]);
        setResult(null);
      }
    } catch (error) {
      console.error('שגיאה בבדיקת קיום חשבונית:', error);
      setError('שגיאה בבדיקת קיום חשבונית');
    } finally {
      setInitialLoading(false);
    }
  };
  
  // טיפול בשינוי סוג המסמך
  const handleDocumentTypeChange = (event) => {
    setDocumentType(event.target.value);
  };
  
  // איפוס הדיאלוג בעת סגירה
  const handleClose = () => {
    if (!loading) {
      setResult(null);
      setError(null);
      setShowConfirmation(false);
      // שמירת מצב של חשבונית קיימת
      onClose();
    }
  };
  
  // יצירת מסמך חדש
  const handleCreateDocument = async () => {
    if (!booking || !booking._id) {
      setError('פרטי הזמנה חסרים');
      return;
    }
    
    // אם זה אישור הזמנה, פשוט נציג אותו
    if (documentType === 'confirmation') {
      setShowConfirmation(true);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await documentService.createDocument(booking._id, documentType);
      
      if (response.success) {
        setResult(response);
        
        // בדיקה האם מדובר בחשבונית קיימת
        if (response.message && response.message.includes('כבר קיימת חשבונית')) {
          // עדכון רשימת החשבוניות הקיימות
          if (response.invoice && !existingInvoices.some(inv => inv._id === response.invoice._id)) {
            setExistingInvoices(prev => [...prev, response.invoice]);
          }
          enqueueSnackbar('כבר קיימת חשבונית להזמנה זו', { variant: 'info' });
        } else {
          enqueueSnackbar('המסמך נוצר בהצלחה', { variant: 'success' });
          // אם נוצרה חשבונית חדשה, נוסיף אותה לרשימה
          if (response.invoice) {
            setExistingInvoices(prev => [...prev, response.invoice]);
          }
        }
      } else {
        throw new Error(response.message || 'שגיאה ביצירת המסמך');
      }
    } catch (err) {
      console.error('שגיאה ביצירת מסמך:', err);
      setError(err.message || 'שגיאה ביצירת המסמך');
      enqueueSnackbar('שגיאה ביצירת המסמך', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // הורדת מסמך
  const handleDownloadDocument = (specificInvoice = null) => {
    const invoiceToDownload = specificInvoice || result?.invoice || getExistingInvoiceByType(documentType);
    
    if (invoiceToDownload && invoiceToDownload._id) {
      setLoading(true);
      const success = documentService.downloadDocument(invoiceToDownload._id);
      
      // אם הפונקציה החזירה הצלחה (ניסיון הורדה התחיל)
      if (success) {
        enqueueSnackbar('המסמך נפתח בחלון חדש', { variant: 'success' });
      } else {
        enqueueSnackbar('אירעה שגיאה בפתיחת המסמך', { variant: 'error' });
      }
      setLoading(false);
    } else {
      enqueueSnackbar('פרטי מסמך חסרים', { variant: 'error' });
    }
  };
  
  // פונקציה להצגת שם המסמך בעברית
  const getDocumentTypeName = (type) => {
    switch (type) {
      case 'invoice':
        return 'חשבונית מס';
      case 'invoice_receipt':
        return 'חשבונית מס/קבלה';
      case 'confirmation':
        return 'אישור הזמנה';
      default:
        return 'מסמך';
    }
  };
  
  // פונקציה לבדיקה אם מסמך מסוג מסוים כבר קיים
  const isDocumentTypeExists = (type) => {
    return existingInvoices.some(invoice => invoice.documentType === type);
  };
  
  // פונקציה לקבלת חשבונית מסוג מסוים
  const getExistingInvoiceByType = (type) => {
    return existingInvoices.find(invoice => invoice.documentType === type);
  };
  
  // אם אנחנו בתהליך טעינה ראשוני
  if (initialLoading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle style={{ textAlign: 'center' }}>
          בודק מסמכים קיימים...
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }
  
  // אם אנחנו מציגים אישור הזמנה, נחזיר את הרכיב המתאים
  if (showConfirmation) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <BookingConfirmationView 
            booking={booking} 
            onClose={() => {
              setShowConfirmation(false);
              // לא סוגרים את הדיאלוג הראשי, רק חוזרים אליו
            }} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ textAlign: 'center' }}>
        יצירת מסמך להזמנה
      </DialogTitle>
      
      <DialogContent>
        {/* פרטי הזמנה */}
        {booking && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>פרטי הזמנה:</strong>
            </Typography>
            <Typography variant="body2">
              <strong>מספר הזמנה:</strong> {booking.bookingNumber}
            </Typography>
            <Typography variant="body2">
              <strong>שם אורח:</strong> {booking.firstName} {booking.lastName}
            </Typography>
            <Typography variant="body2">
              <strong>תאריכים:</strong> {new Date(booking.checkIn).toLocaleDateString('he-IL')} - {new Date(booking.checkOut).toLocaleDateString('he-IL')}
            </Typography>
            <Typography variant="body2">
              <strong>סכום:</strong> {booking.price} ₪
            </Typography>
          </Box>
        )}
        
        {/* בחירת סוג מסמך - תמיד מוצג, גם אם יש חשבונית קיימת */}
        {!result && !loading && (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="subtitle1" gutterBottom>
              <strong>בחר סוג מסמך:</strong>
            </Typography>
            <RadioGroup value={documentType} onChange={handleDocumentTypeChange}>
              <FormControlLabel 
                value="invoice" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: isDocumentTypeExists('invoice') ? 0.6 : 1 }}>
                      <ReceiptIcon sx={{ mr: 1 }} /> 
                      חשבונית מס
                      {isDocumentTypeExists('invoice') && (
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          (כבר קיימת)
                        </Typography>
                      )}
                    </Box>
                    {isDocumentTypeExists('invoice') && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />
                        <Button
                          onClick={() => handleDownloadDocument(getExistingInvoiceByType('invoice'))}
                          size="small"
                          variant="outlined"
                          startIcon={<FileDownloadIcon />}
                          sx={{ minWidth: 'auto', px: 1 }}
                        >
                          הורד
                        </Button>
                      </Box>
                    )}
                  </Box>
                }
                // לא מאפשר לבחור חשבונית מס אם כבר קיימת
                disabled={isDocumentTypeExists('invoice')}
              />
              <FormControlLabel 
                value="invoice_receipt" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: isDocumentTypeExists('invoice_receipt') ? 0.6 : 1 }}>
                      <ReceiptIcon sx={{ mr: 1 }} /> 
                      חשבונית מס/קבלה
                      {isDocumentTypeExists('invoice_receipt') && (
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          (כבר קיימת)
                        </Typography>
                      )}
                    </Box>
                    {isDocumentTypeExists('invoice_receipt') && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />
                        <Button
                          onClick={() => handleDownloadDocument(getExistingInvoiceByType('invoice_receipt'))}
                          size="small"
                          variant="outlined"
                          startIcon={<FileDownloadIcon />}
                          sx={{ minWidth: 'auto', px: 1 }}
                        >
                          הורד
                        </Button>
                      </Box>
                    )}
                  </Box>
                }
                // לא מאפשר לבחור חשבונית מס/קבלה אם כבר קיימת כזאת
                disabled={isDocumentTypeExists('invoice_receipt')}
              />
              <FormControlLabel 
                value="confirmation" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssignmentIcon sx={{ mr: 1 }} /> אישור הזמנה
                  </Box>
                }
              />

            </RadioGroup>
          </FormControl>
        )}
        
        {/* מצב טעינה */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              יוצר {getDocumentTypeName(documentType)}...
            </Typography>
          </Box>
        )}
        
        {/* הצגת שגיאה */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* הצגת תוצאה מוצלחת - חשבונית חדשה */}
        {result && result.success && !result.message?.includes('כבר קיימת חשבונית') && (
          <Box sx={{ mt: 2 }}>
            <Alert 
              icon={<CheckIcon />}
              severity="success"
              sx={{ mb: 2 }}
            >
              {getDocumentTypeName(documentType)} נוצר בהצלחה!
            </Alert>
            
            {result.invoice && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>מספר {getDocumentTypeName(documentType)}:</strong> {result.invoice.invoiceNumber}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>תאריך:</strong> {new Date(result.invoice.createdAt).toLocaleDateString('he-IL')}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {/* כפתורים למצב רגיל - עדיין לא נוצר מסמך חדש */}
        {!loading && !result && (
          <>
            <Button onClick={handleClose} color="inherit">
              ביטול
            </Button>
            <Button 
              onClick={handleCreateDocument} 
              color="primary" 
              variant="contained"
              // מאופשר רק אם אין חשבונית קיימת מאותו סוג (לא רלוונטי לאישור הזמנה)
              disabled={documentType !== 'confirmation' && isDocumentTypeExists(documentType)}
              title={
                documentType !== 'confirmation' && isDocumentTypeExists(documentType) 
                  ? `${getDocumentTypeName(documentType)} כבר קיים להזמנה זו`
                  : ''
              }
            >
              {documentType === 'confirmation' ? 'הצג' : 'צור'} {getDocumentTypeName(documentType)}
              {documentType !== 'confirmation' && isDocumentTypeExists(documentType) && ' (כבר קיים)'}
            </Button>
          </>
        )}
        
        {/* כפתורים למצב של תוצאה מוצלחת */}
        {result && result.success && !result.message?.includes('כבר קיימת חשבונית') && (
          <>
            <Button onClick={handleClose} color="inherit">
              סגור
            </Button>
            <Button
              onClick={handleDownloadDocument}
              color="primary"
              variant="contained"
            >
              הורד {getDocumentTypeName(documentType)}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateDocumentDialog; 