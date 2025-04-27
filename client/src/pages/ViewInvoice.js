import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon, 
  CloudDownload as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * דף צפייה בחשבונית ספציפית
 */
const ViewInvoice = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // טעינת נתוני החשבונית כאשר הדף נטען
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // טעינת פרטי החשבונית
        const invoiceResponse = await axios.get(`/api/invoices/${invoiceId}`);
        setInvoice(invoiceResponse.data.data);
        
        // טעינת ה-PDF של החשבונית
        const pdfResponse = await axios.get(`/api/invoices/${invoiceId}/pdf`);
        setPdfUrl(pdfResponse.data.pdfPath);
      } catch (err) {
        console.error('שגיאה בטעינת נתוני החשבונית:', err);
        setError('אירעה שגיאה בטעינת החשבונית. אנא נסה שנית.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoiceData();
  }, [invoiceId]);
  
  // טיפול בלחיצה על כפתור חזרה
  const handleBack = () => {
    navigate('/invoices');
  };
  
  // טיפול בהורדת החשבונית
  const handleDownload = () => {
    window.open(`/api/invoices/${invoiceId}/download`, '_blank');
  };
  
  // טיפול בהדפסת החשבונית
  const handlePrint = () => {
    if (!pdfUrl) return;
    
    // פתיחת PDF בחלון חדש והדפסה
    const printWindow = window.open(`${process.env.REACT_APP_API_URL || ''}${pdfUrl}`, '_blank');
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  };
  
  // תצוגת טעינה
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // תצוגת שגיאה
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            חזרה לרשימת החשבוניות
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // כאשר אין נתונים
  if (!invoice || !pdfUrl) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="warning">
            לא נמצאו נתונים לחשבונית זו
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              חזרה לרשימת החשבוניות
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* כותרת ופעולות */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            חשבונית מס מספר: {invoice.invoiceNumber}
          </Typography>
        </Box>
        
        <Box>
          <Button 
            startIcon={<DownloadIcon />} 
            variant="outlined" 
            onClick={handleDownload}
            sx={{ mr: 1 }}
          >
            הורדה
          </Button>
          <Button 
            startIcon={<PrintIcon />} 
            variant="contained" 
            onClick={handlePrint}
          >
            הדפסה
          </Button>
        </Box>
      </Box>
      
      {/* תצוגת ה-PDF */}
      <Paper sx={{ height: '80vh', width: '100%', overflow: 'hidden' }}>
        <iframe
          src={`${process.env.REACT_APP_API_URL || ''}${pdfUrl}`}
          width="100%"
          height="100%"
          title="תצוגת חשבונית"
          style={{ border: 'none' }}
        />
      </Paper>
    </Container>
  );
};

export default ViewInvoice; 