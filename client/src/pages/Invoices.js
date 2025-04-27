import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import InvoicesList from '../components/invoices/InvoicesList';
import CreateInvoiceDialog from '../components/invoices/CreateInvoiceDialog';
import InvoicePreview from '../components/invoices/InvoicePreview';
import axios from 'axios';
import { useSearchParams, useLocation } from 'react-router-dom';

/**
 * דף ניהול חשבוניות במערכת
 */
const Invoices = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const urlBookingId = searchParams.get('bookingId') || state?.bookingId;
  
  // מצב בחירת מיקום (אור יהודה/רוטשילד)
  const [location, setLocation] = useState('airport');
  
  // מצב דיאלוגים
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // מצב נתונים
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // מצב הודעות מערכת
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // סגירת הודעת מערכת
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // הצגת הודעת מערכת
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ message, severity, open: true });
  };
  
  // שינוי מיקום
  const handleLocationChange = (event, newValue) => {
    setLocation(newValue);
  };
  
  // פתיחת דיאלוג יצירת חשבונית אוטומטית אם יש מזהה הזמנה ב-URL
  useEffect(() => {
    if (urlBookingId) {
      setCreateDialogOpen(true);
    }
  }, [urlBookingId]);
  
  // פתיחת דיאלוג יצירת חשבונית
  const handleCreateInvoice = () => {
    setCreateDialogOpen(true);
  };
  
  // טיפול בסגירת דיאלוג יצירת חשבונית
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };
  
  // טיפול בהצלחת יצירת חשבונית
  const handleCreateSuccess = (invoice) => {
    // רענון הנתונים
    setRefreshTrigger(prev => prev + 1);
    
    // הצגת הודעת הצלחה
    showSnackbar(`חשבונית מספר ${invoice.invoiceNumber} נוצרה בהצלחה`, 'success');
  };
  
  // טיפול בהצגת חשבונית
  const handleViewInvoice = async (invoiceId) => {
    setSelectedInvoice(invoiceId);
    setViewDialogOpen(true);
  };
  
  // טיפול בעריכת חשבונית
  const handleEditInvoice = (invoiceId) => {
    // כרגע אין דיאלוג עריכה - נפעיל את הצגת החשבונית
    handleViewInvoice(invoiceId);
  };
  
  // טיפול בסגירת תצוגת חשבונית
  const handleCloseInvoiceView = () => {
    setViewDialogOpen(false);
    setSelectedInvoice(null);
  };
  
  // טיפול בביטול חשבונית
  const handleCancelInvoice = (invoiceId) => {
    setSelectedInvoice(invoiceId);
    setCancelDialogOpen(true);
    setCancelReason('');
    setCancelError('');
  };
  
  // ביטול החשבונית בפועל
  const submitCancelInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      setCancelLoading(true);
      setCancelError('');
      
      const response = await axios.put(`/api/invoices/${selectedInvoice}/cancel`, {
        reason: cancelReason
      });
      
      // סגירת הדיאלוג ורענון הנתונים
      setCancelDialogOpen(false);
      setRefreshTrigger(prev => prev + 1);
      
      // הצגת הודעת הצלחה
      showSnackbar('החשבונית בוטלה בהצלחה', 'success');
    } catch (error) {
      console.error('שגיאה בביטול החשבונית:', error);
      setCancelError(error.response?.data?.message || 'אירעה שגיאה בביטול החשבונית. אנא נסה שנית.');
    } finally {
      setCancelLoading(false);
    }
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ניהול חשבוניות
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ניהול, הפקה וצפייה בחשבוניות
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3, borderRadius: '8px' }}>
        <Tabs
          value={location}
          onChange={handleLocationChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab value="airport" label="אור יהודה" />
          <Tab value="rothschild" label="רוטשילד" />
        </Tabs>
      </Paper>
      
      <InvoicesList
        location={location}
        onViewInvoice={handleViewInvoice}
        onEditInvoice={handleEditInvoice}
        onCreateInvoice={handleCreateInvoice}
        onCancelInvoice={handleCancelInvoice}
        refreshData={refreshTrigger}
      />
      
      {/* דיאלוג יצירת חשבונית */}
      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        onSuccess={handleCreateSuccess}
        location={location}
        bookingId={urlBookingId}
      />
      
      {/* דיאלוג תצוגת חשבונית */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseInvoiceView}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <InvoicePreview 
            invoiceId={selectedInvoice} 
            onClose={handleCloseInvoiceView}
          />
        </DialogContent>
      </Dialog>
      
      {/* דיאלוג ביטול חשבונית */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>ביטול חשבונית</DialogTitle>
        <DialogContent>
          {cancelError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cancelError}
            </Alert>
          )}
          
          <Typography variant="body1" gutterBottom sx={{ my: 1 }}>
            האם אתה בטוח שברצונך לבטל את החשבונית?
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="סיבת הביטול"
            type="text"
            fullWidth
            variant="outlined"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelLoading}>
            ביטול
          </Button>
          <Button 
            onClick={submitCancelInvoice} 
            color="error" 
            variant="contained"
            disabled={cancelLoading}
            startIcon={cancelLoading ? <CircularProgress size={20} /> : null}
          >
            {cancelLoading ? 'מבטל...' : 'ביטול חשבונית'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* הודעות מערכת */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Invoices; 