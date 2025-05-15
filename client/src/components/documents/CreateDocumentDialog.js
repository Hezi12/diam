/**
 * דיאלוג ליצירת מסמכים מתוך הזמנה (חשבוניות, חשבוניות-קבלה, אישורי הזמנה)
 */

import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import {
  ReceiptLong as ReceiptIcon,
  Description as DescriptionIcon,
  FileDownload as FileDownloadIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import documentService from '../../services/documentService';

const CreateDocumentDialog = ({ open, onClose, booking }) => {
  // מצב סוג המסמך
  const [documentType, setDocumentType] = useState('invoice');
  
  // מצב טעינה ותוצאות
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // הוק להודעות
  const { enqueueSnackbar } = useSnackbar();
  
  // טיפול בשינוי סוג המסמך
  const handleDocumentTypeChange = (event) => {
    setDocumentType(event.target.value);
  };
  
  // איפוס הדיאלוג בעת סגירה
  const handleClose = () => {
    if (!loading) {
      setResult(null);
      setError(null);
      onClose();
    }
  };
  
  // יצירת מסמך חדש
  const handleCreateDocument = async () => {
    if (!booking || !booking._id) {
      setError('פרטי הזמנה חסרים');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await documentService.createDocument(booking._id, documentType);
      
      if (response.success) {
        setResult(response);
        enqueueSnackbar('המסמך נוצר בהצלחה', { variant: 'success' });
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
  const handleDownloadDocument = () => {
    if (result && result.invoice && result.invoice._id) {
      documentService.downloadDocument(result.invoice._id);
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptIcon sx={{ mr: 1 }} /> חשבונית מס
                  </Box>
                }
              />
              <FormControlLabel 
                value="invoice_receipt" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptIcon sx={{ mr: 1 }} /> חשבונית מס/קבלה
                  </Box>
                }
              />
              <FormControlLabel 
                value="confirmation" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 1 }} /> אישור הזמנה
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
        
        {/* הצגת תוצאה מוצלחת */}
        {result && result.success && (
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
        {!loading && !result && (
          <>
            <Button onClick={handleClose} color="inherit">
              ביטול
            </Button>
            <Button 
              onClick={handleCreateDocument} 
              color="primary" 
              variant="contained"
              startIcon={<ReceiptIcon />}
            >
              צור {getDocumentTypeName(documentType)}
            </Button>
          </>
        )}
        
        {result && result.success && (
          <>
            <Button onClick={handleClose} color="inherit">
              סגור
            </Button>
            <Button
              onClick={handleDownloadDocument}
              color="primary"
              variant="contained"
              startIcon={<FileDownloadIcon />}
            >
              הורד {getDocumentTypeName(documentType)}
            </Button>
          </>
        )}
        
        {error && (
          <Button onClick={handleClose} color="inherit">
            סגור
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateDocumentDialog; 