/**
 * דיאלוג ליצירת מסמכים מתוך הזמנה (חשבוניות ואישורי הזמנה)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  Check as CheckIcon,
  Assignment as AssignmentIcon,
  Receipt as InvoiceReceiptIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import documentService from '../../services/documentService';
import axios from 'axios';
import PaymentMethodDialog from './PaymentMethodDialog';


const CreateDocumentDialog = ({ open, onClose, booking, onRefresh }) => {
  // מצב סוג המסמך
  const [documentType, setDocumentType] = useState('invoice');
  
  // מצב טעינה ותוצאות
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [existingInvoice, setExistingInvoice] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // מצב תצוגת אישור הזמנה
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // מצב דיאלוג בחירת אמצעי תשלום
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  
  // הוק להודעות
  const { enqueueSnackbar } = useSnackbar();
  
  // בדיקה אם קיימת חשבונית להזמנה
  const checkIfInvoiceExists = useCallback(async () => {
    if (!booking || !booking._id) return;
    
    setInitialLoading(true);
    
    try {
      // שליחת בקשה לשרת לבדוק אם קיימת חשבונית להזמנה
      const response = await axios.get(`/api/documents/check-booking/${booking._id}`);
      
      if (response.data.exists && response.data.invoice) {
        setExistingInvoice(response.data.invoice);
        // אם יש חשבונית, נבחר אישור הזמנה כברירת מחדל
        setDocumentType('confirmation');
      } else {
        setExistingInvoice(null);
        setResult(null);
      }
    } catch (error) {
      console.error('שגיאה בבדיקת קיום חשבונית:', error);
      setError('שגיאה בבדיקת קיום חשבונית');
    } finally {
      setInitialLoading(false);
    }
  }, [booking]);
  
  // בדיקה ראשונית בעת פתיחת הדיאלוג אם כבר קיימת חשבונית
  useEffect(() => {
    if (open && booking) {
      checkIfInvoiceExists();
    }
  }, [open, booking, checkIfInvoiceExists]);
  
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
    
    // אם זה חשבונית + קבלה, נפתח דיאלוג בחירת אמצעי תשלום
    if (documentType === 'invoice_receipt') {
      setPaymentMethodDialogOpen(true);
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
          // עדכון החשבונית הקיימת
          if (response.invoice) {
            setExistingInvoice(response.invoice);
          }
          enqueueSnackbar('כבר קיימת חשבונית להזמנה זו', { variant: 'info' });
        } else {
          enqueueSnackbar('החשבונית נוצרה בהצלחה', { variant: 'success' });
          // אם נוצרה חשבונית חדשה, נעדכן את המצב
          if (response.invoice) {
            setExistingInvoice(response.invoice);
          }
          
          // 🔄 רענון הנתונים בדף הראשי
          if (onRefresh) {
            onRefresh();
          }
        }
      } else {
        throw new Error(response.message || 'שגיאה ביצירת החשבונית');
      }
    } catch (err) {
      console.error('שגיאה ביצירת מסמך:', err);
      setError(err.message || 'שגיאה ביצירת החשבונית');
      enqueueSnackbar('שגיאה ביצירת החשבונית', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // טיפול ביצירת חשבונית עם קבלה
  const handleCreateInvoiceWithReceipt = async (paymentMethod) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setPaymentMethodDialogOpen(false);
      
      const response = await documentService.createInvoiceWithReceipt(booking._id, paymentMethod);
      
      if (response.success) {
        setResult(response);
        enqueueSnackbar('חשבונית עם קבלה נוצרה בהצלחה', { variant: 'success' });
        if (response.invoice) {
          setExistingInvoice(response.invoice);
        }
        
        // 🔄 רענון הנתונים בדף הראשי
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(response.message || 'שגיאה ביצירת חשבונית עם קבלה');
      }
    } catch (err) {
      console.error('שגיאה ביצירת חשבונית עם קבלה:', err);
      setError(err.message || 'שגיאה ביצירת חשבונית עם קבלה');
      enqueueSnackbar('שגיאה ביצירת חשבונית עם קבלה', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה להצגת שם המסמך בעברית
  const getDocumentTypeName = (type) => {
    switch (type) {
      case 'invoice':
        return 'חשבונית מס';
      case 'invoice_receipt':
        return 'חשבונית + קבלה';
      case 'confirmation':
        return 'אישור הזמנה';
      default:
        return 'מסמך';
    }
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
  
  // אם אנחנו מציגים אישור הזמנה, נסגור את הדיאלוג
  if (showConfirmation) {
    // פונקציונליות אישור הזמנה עברה ל-CreditCardChargeDialog
    setShowConfirmation(false);
    handleClose();
    return null;
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
        
        {/* בחירת סוג מסמך */}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', opacity: existingInvoice ? 0.6 : 1 }}>
                      <ReceiptIcon sx={{ mr: 1 }} /> 
                      חשבונית מס
                      {existingInvoice && (
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          (כבר קיימת)
                        </Typography>
                      )}
                    </Box>
                    {existingInvoice && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon sx={{ color: '#4caf50', fontSize: '1.2rem' }} />
                      </Box>
                    )}
                  </Box>
                }
                // לא מאפשר לבחור חשבונית מס אם כבר קיימת
                disabled={!!existingInvoice}
              />
              <FormControlLabel 
                value="invoice_receipt" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InvoiceReceiptIcon sx={{ mr: 1 }} /> 
                    חשבונית + קבלה
                  </Box>
                }
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
                
                {/* הצגת קבלה אם קיימת */}
                {result.receipt && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>מספר קבלה:</strong> {result.receipt.invoiceNumber}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>תאריך קבלה:</strong> {new Date(result.receipt.createdAt).toLocaleDateString('he-IL')}
                    </Typography>
                  </>
                )}
                
                {/* הצגת הודעה מפורטת מהשרת */}
                {result.message && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {result.message}
                    </Typography>
                  </>
                )}
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
              // מאופשר רק אם אין חשבונית קיימת (לא רלוונטי לאישור הזמנה או חשבונית+קבלה)
              disabled={documentType === 'invoice' && !!existingInvoice}
              title={
                documentType === 'invoice' && existingInvoice 
                  ? 'חשבונית מס כבר קיימת להזמנה זו'
                  : ''
              }
            >
              {documentType === 'confirmation' ? 'הצג' : 'צור'} {getDocumentTypeName(documentType)}
              {documentType === 'invoice' && existingInvoice && ' (כבר קיים)'}
            </Button>
          </>
        )}
        
        {/* כפתורים למצב של תוצאה מוצלחת */}
        {result && result.success && !result.message?.includes('כבר קיימת חשבונית') && (
          <>
            <Button onClick={handleClose} color="inherit">
              סגור
            </Button>
          </>
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

export default CreateDocumentDialog; 