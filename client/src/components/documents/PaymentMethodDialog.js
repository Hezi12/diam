/**
 * דיאלוג לבחירת אמצעי תשלום ליצירת חשבונית עם קבלה
 */

import React, { useState, useEffect } from 'react';
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
  Paper
} from '@mui/material';
import {
  Money as CashIcon,
  CreditCard as CreditCardIcon,
  PhoneAndroid as BitIcon,
  AccountBalance as BankTransferIcon
} from '@mui/icons-material';

const PaymentMethodDialog = ({ open, onClose, onSelectPaymentMethod, booking }) => {
  // אפשרויות אמצעי תשלום
  const paymentMethods = [
    {
      value: 'cash',
      label: 'מזומן',
      icon: <CashIcon sx={{ mr: 1, color: '#4caf50' }} />,
      description: 'תשלום במזומן'
    },
    {
      value: 'credit_card',
      label: 'אשראי',
      icon: <CreditCardIcon sx={{ mr: 1, color: '#2196f3' }} />,
      description: 'תשלום בכרטיס אשראי'
    },
    {
      value: 'bit',
      label: 'ביט',
      icon: <BitIcon sx={{ mr: 1, color: '#ff9800' }} />,
      description: 'תשלום דרך ביט'
    },
    {
      value: 'bank_transfer',
      label: 'העברה בנקאית',
      icon: <BankTransferIcon sx={{ mr: 1, color: '#9c27b0' }} />,
      description: 'העברה בנקאית'
    }
  ];

  // פונקציה לקבלת שם האמצעי תשלום שנבחר
  const getPaymentMethodLabel = (method) => {
    const methodObj = paymentMethods.find(pm => pm.value === method);
    return methodObj ? methodObj.label : method;
  };

  // פונקציה להמרת paymentStatus לאמצעי תשלום בדיאלוג
  const getPaymentMethodFromStatus = (paymentStatus) => {
    if (!paymentStatus) return 'cash';
    
    // מיפוי סטטוסי תשלום לאמצעי תשלום בדיאלוג
    const statusToMethodMap = {
      // אשראי
      'credit_rothschild': 'credit_card',
      'credit_or_yehuda': 'credit_card',
      
      // ביט
      'bit_mizrahi': 'bit',
      'bit_poalim': 'bit',
      
      // העברה בנקאית
      'transfer_mizrahi': 'bank_transfer',
      'transfer_poalim': 'bank_transfer',
      
      // PayBox (נחשב כאשראי)
      'paybox_mizrahi': 'credit_card',
      
      // אחר - ברירת מחדל מזומן
      'other': 'cash',
      'לא שולם': 'cash',
      'unpaid': 'cash'
    };
    
    return statusToMethodMap[paymentStatus] || 'cash';
  };

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');

  // שימוש ב-useEffect לעדכון אוטומטי של אמצעי התשלום כאשר הדיאלוג נפתח
  useEffect(() => {
    if (open && booking && booking.paymentStatus) {
      const autoSelectedMethod = getPaymentMethodFromStatus(booking.paymentStatus);
      console.log('🔄 בחירה אוטומטית של אמצעי תשלום:', {
        bookingId: booking._id,
        paymentStatus: booking.paymentStatus,
        selectedMethod: autoSelectedMethod
      });
      setSelectedPaymentMethod(autoSelectedMethod);
    } else if (open) {
      // אם אין סטטוס תשלום או הזמנה, ברירת מחדל
      setSelectedPaymentMethod('cash');
    }
  }, [open, booking]);

  const handlePaymentMethodChange = (event) => {
    setSelectedPaymentMethod(event.target.value);
  };

  const handleConfirm = () => {
    onSelectPaymentMethod(selectedPaymentMethod);
  };

  const handleClose = () => {
    // איפוס לברירת מחדל רק אם אין הזמנה או סטטוס תשלום
    const defaultMethod = (booking && booking.paymentStatus) 
      ? getPaymentMethodFromStatus(booking.paymentStatus) 
      : 'cash';
    setSelectedPaymentMethod(defaultMethod);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle style={{ textAlign: 'center' }}>
        באיזה אמצעי שולם?
      </DialogTitle>
      
      <DialogContent>
        {/* פרטי הזמנה */}
        {booking && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>הזמנה #{booking.bookingNumber}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {booking.firstName} {booking.lastName} | {booking.price} ₪
            </Typography>
            {booking.paymentStatus && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  סטטוס תשלום: <strong>{booking.paymentStatus}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#1976d2', fontStyle: 'italic' }}>
                  אמצעי התשלום נבחר אוטומטיות על פי סטטוס התשלום
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
          <strong>בחר אמצעי תשלום:</strong>
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup value={selectedPaymentMethod} onChange={handlePaymentMethodChange}>
            {paymentMethods.map((method) => (
              <FormControlLabel
                key={method.value}
                value={method.value}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                    {method.icon}
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {method.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {method.description}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    bgcolor: '#f5f5f5'
                  },
                  '& .MuiFormControlLabel-root': {
                    margin: 0
                  }
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#1976d2' }}>
            <strong>לתשומת לב:</strong> יווצר מסמך חשבונית + קבלה ב-iCount עם אמצעי התשלום שנבחר.
          </Typography>
          {booking && booking.paymentStatus && (
            <Typography variant="body2" sx={{ color: '#2e7d32', mt: 1, fontWeight: 500 }}>
              ✓ נבחר אוטומטית "{getPaymentMethodLabel(selectedPaymentMethod)}" על פי סטטוס התשלום: {booking.paymentStatus}
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          ביטול
        </Button>
        <Button onClick={handleConfirm} color="primary" variant="contained">
          צור חשבונית + קבלה
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentMethodDialog;
