import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  Select,
  CircularProgress,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArticleIcon from '@mui/icons-material/Article';
import ReceiptIcon from '@mui/icons-material/Receipt';

import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import axios from 'axios';

import CreateDocumentDialog from '../documents/CreateDocumentDialog';
import CreditCardChargeDialog from '../payment/CreditCardChargeDialog';

/**
 * רכיב להצגת פרטי הזמנה מלאים
 */
const BookingDetails = ({ open, onClose, bookingId, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [booking, setBooking] = useState(null);
  const [editedBooking, setEditedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(false);

  // הגדרות צבעים לפי סטטוס הזמנה
  const bookingStatusColors = {
    confirmed: {
      bgColor: 'rgba(48, 209, 88, 0.1)',
      borderColor: 'rgba(48, 209, 88, 0.2)',
      textColor: '#30d158',
      icon: <CheckCircleIcon fontSize="small" sx={{ color: '#30d158' }} />
    },
    pending: {
      bgColor: 'rgba(255, 149, 0, 0.1)',
      borderColor: 'rgba(255, 149, 0, 0.2)',
      textColor: '#ff9500',
      icon: <PendingIcon fontSize="small" sx={{ color: '#ff9500' }} />
    },
    cancelled: {
      bgColor: 'rgba(255, 55, 95, 0.1)',
      borderColor: 'rgba(255, 55, 95, 0.2)',
      textColor: '#ff375f',
      icon: <CancelIcon fontSize="small" sx={{ color: '#ff375f' }} />
    },
    completed: {
      bgColor: 'rgba(94, 92, 230, 0.1)',
      borderColor: 'rgba(94, 92, 230, 0.2)',
      textColor: '#5e5ce6',
      icon: <AssignmentTurnedInIcon fontSize="small" sx={{ color: '#5e5ce6' }} />
    }
  };

  // הגדרת טקסט לפי סטטוס תשלום
  const paymentStatusText = {
    unpaid: 'לא שולם',
    cash: 'מזומן',
    credit_or_yehuda: 'אשראי אור יהודה',
    credit_rothschild: 'אשראי רוטשילד',
    transfer_mizrahi: 'העברה מזרחי',
    bit_mizrahi: 'ביט מזרחי',
    paybox_mizrahi: 'פייבוקס מזרחי',
    transfer_poalim: 'העברה פועלים',
    bit_poalim: 'ביט פועלים',
    paybox_poalim: 'פייבוקס פועלים',
    other: 'אחר'
  };

  // הגדרת טקסט לפי סטטוס הזמנה
  const bookingStatusText = {
    confirmed: 'מאושר',
    pending: 'בהמתנה',
    cancelled: 'בוטל',
    completed: 'הושלם'
  };

  // בדיקה אם קיימת חשבונית להזמנה
  const checkIfInvoiceExists = async (bookingId) => {
    if (!bookingId) return;
    
    try {
      // שליחת בקשה לשרת לבדוק אם קיימת חשבונית להזמנה
      const response = await axios.get(`/api/documents/check-booking/${bookingId}`);
      setHasInvoice(response.data.exists);
      return response.data.exists;
    } catch (error) {
      console.error('שגיאה בבדיקת קיום חשבונית:', error);
      setHasInvoice(false);
      return false;
    }
  };

  // טעינת מידע ההזמנה בעת פתיחת המודל
  useEffect(() => {
    if (open && bookingId) {
      setLoading(true);
      setError(null);
      
      console.log('מנסה לטעון הזמנה עם מזהה:', bookingId);
      
      axios.get(`/api/bookings/single/${bookingId}`)
        .then(response => {
          console.log('הזמנה נטענה:', response.data);
          setBooking(response.data);
          setEditedBooking(response.data);
          
          // בדיקה אם קיימת חשבונית להזמנה
          checkIfInvoiceExists(bookingId);
        })
        .catch(err => {
          console.error('שגיאה בטעינת פרטי ההזמנה:', err);
          setError('לא ניתן לטעון את פרטי ההזמנה. נסו שוב מאוחר יותר.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, bookingId]);

  if (!open) return null;
  
  if (loading) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            טוען פרטי הזמנה...
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }
  
  if (error || !booking) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>שגיאה בטעינת הזמנה</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography color="error">{error || 'לא ניתן לטעון את פרטי ההזמנה'}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose}>סגירה</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const statusColors = bookingStatusColors[booking.status] || bookingStatusColors.pending;

  const handleEditToggle = () => {
    if (isEditing) {
      // שמירת השינויים
      onEdit(editedBooking);
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedBooking(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, d בMMMM yyyy', { locale: he });
    } catch (error) {
      return dateString || 'תאריך לא זמין';
    }
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
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                mr: 1.5,
                bgcolor: statusColors.bgColor
              }}
            >
              {statusColors.icon}
            </Box>
            <Typography variant="h6" fontWeight={500}>
              הזמנה מס׳ {booking?.bookingNumber}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* כפתור יצירת מסמך/חשבונית - יוצג תמיד, גם אם יש חשבונית */}
            {!isEditing && (
              <Button
                onClick={() => setDocumentDialogOpen(true)}
                startIcon={<ReceiptIcon />}
                variant="outlined"
                color="primary"
                sx={{ mr: 1 }}
              >
                יצירת מסמך
              </Button>
            )}
            
            {/* כפתור סליקת אשראי */}
            {!isEditing && (
              <Button
                onClick={() => setChargeDialogOpen(true)}
                startIcon={<CreditCardIcon />}
                variant="outlined"
                color="secondary"
                sx={{ mr: 1 }}
              >
                סליקת אשראי
              </Button>
            )}
            
            {/* הצגת סימון שקיימת חשבונית */}
            {!isEditing && hasInvoice && (
              <Tooltip title="קיימת חשבונית להזמנה זו">
                <Box sx={{ 
                  color: '#06a271', 
                  display: 'flex', 
                  alignItems: 'center', 
                  mr: 1,
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}>
                  <CheckCircleIcon sx={{ fontSize: '1.2rem', mr: 0.5 }} />
                  חשבונית קיימת
                </Box>
              </Tooltip>
            )}
            
            <Button
              startIcon={isEditing ? null : <EditIcon />}
              variant={isEditing ? "contained" : "outlined"}
              color="primary"
              onClick={handleEditToggle}
              sx={{ mr: 1 }}
            >
              {isEditing ? 'שמירה' : 'עריכה'}
            </Button>
            <IconButton onClick={onClose} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2 }}>
          <Grid container spacing={3}>
            {/* מידע אישי */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>פרטי אורח</Typography>
                
                {isEditing ? (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="שם פרטי"
                          name="firstName"
                          value={editedBooking.firstName || ''}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="שם משפחה"
                          name="lastName"
                          value={editedBooking.lastName || ''}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="טלפון"
                          name="phone"
                          value={editedBooking.phone || ''}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="דוא״ל"
                          name="email"
                          value={editedBooking.email || ''}
                          onChange={handleChange}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="הערות"
                          name="notes"
                          value={editedBooking.notes || ''}
                          onChange={handleChange}
                          variant="outlined"
                          multiline
                          rows={3}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">שם:</Typography>
                      <Typography variant="body1">{`${booking.firstName} ${booking.lastName}`}</Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">טלפון:</Typography>
                      <Typography variant="body1">{booking.phone || 'לא צוין'}</Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">דוא״ל:</Typography>
                      <Typography variant="body1">{booking.email || 'לא צוין'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">הערות:</Typography>
                      <Typography variant="body1">{booking.notes || 'אין הערות'}</Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>

            {/* פרטי הזמנה */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>פרטי שהייה</Typography>
                
                {isEditing ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="סטטוס הזמנה"
                        name="status"
                        value={editedBooking.status || 'pending'}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                      >
                        <MenuItem value="confirmed">מאושר</MenuItem>
                        <MenuItem value="pending">בהמתנה</MenuItem>
                        <MenuItem value="cancelled">בוטל</MenuItem>
                        <MenuItem value="completed">הושלם</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="סטטוס תשלום"
                        name="paymentStatus"
                        value={editedBooking.paymentStatus || 'unpaid'}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                      >
                        <MenuItem value="unpaid">לא שולם</MenuItem>
                        <MenuItem value="cash">מזומן</MenuItem>
                        <MenuItem value="credit_or_yehuda">אשראי אור יהודה</MenuItem>
                        <MenuItem value="credit_rothschild">אשראי רוטשילד</MenuItem>
                        <MenuItem value="transfer_mizrahi">העברה מזרחי</MenuItem>
                        <MenuItem value="bit_mizrahi">ביט מזרחי</MenuItem>
                        <MenuItem value="transfer_poalim">העברה פועלים</MenuItem>
                        <MenuItem value="bit_poalim">ביט פועלים</MenuItem>
                        <MenuItem value="other">אחר</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="מיקום"
                        name="location"
                        value={editedBooking.location || 'airport'}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                      >
                        <MenuItem value="airport">אור יהודה</MenuItem>
                        <MenuItem value="rothschild">רוטשילד</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="number"
                        label="מחיר"
                        name="price"
                        value={editedBooking.price || 0}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">כניסה:</Typography>
                      <Typography variant="body1">{formatDate(booking.checkIn)}</Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">יציאה:</Typography>
                      <Typography variant="body1">{formatDate(booking.checkOut)}</Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">מספר לילות:</Typography>
                      <Typography variant="body1">{booking.nights}</Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">מיקום:</Typography>
                      <Typography variant="body1">
                        {booking.location === 'airport' ? 'אור יהודה' : 
                         booking.location === 'rothschild' ? 'רוטשילד' : 
                         booking.location}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">סטטוס תשלום:</Typography>
                      <Typography variant="body1">{paymentStatusText[booking.paymentStatus] || 'לא שולם'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">סה״כ לתשלום:</Typography>
                      <Typography variant="body1">₪{booking.price}</Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outlined" color="inherit">
                ביטול
              </Button>
              <Button onClick={handleEditToggle} variant="contained" color="primary">
                שמירת שינויים
              </Button>
            </>
          ) : (
            <>
              <Button 
                startIcon={<DeleteIcon />} 
                onClick={() => onDelete(booking._id)} 
                variant="outlined" 
                color="error"
              >
                מחיקת הזמנה
              </Button>
              <Button variant="contained" onClick={onClose} color="primary">
                סגירה
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* דיאלוג יצירת מסמך */}
      <CreateDocumentDialog
        open={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        booking={booking}
      />

      {/* דיאלוג סליקת אשראי */}
      <CreditCardChargeDialog
        open={chargeDialogOpen}
        onClose={() => setChargeDialogOpen(false)}
        booking={booking}
      />
    </>
  );
};

export default BookingDetails; 