import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Grid, 
  Skeleton,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CloudDownload as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import moment from 'moment';
import axios from 'axios';

/**
 * רכיב תצוגה מקדימה של חשבונית PDF
 */
const InvoicePreview = ({ invoiceId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // טעינת נתוני החשבונית
  useEffect(() => {
    if (!invoiceId) return;
    
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // טעינת פרטי החשבונית
        const response = await axios.get(`/api/invoices/${invoiceId}`);
        setInvoiceData(response.data.data);
        
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
      <Paper sx={{ p: 3, width: '100%', maxWidth: 800, mx: 'auto', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box>
          <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={400} />
        </Box>
      </Paper>
    );
  }
  
  // תצוגת שגיאה
  if (error) {
    return (
      <Paper sx={{ p: 3, width: '100%', maxWidth: 800, mx: 'auto', position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
      </Paper>
    );
  }
  
  // כאשר אין נתונים
  if (!invoiceData) {
    return null;
  }
  
  // תצוגת מסמך ה-PDF
  return (
    <Paper sx={{ width: '100%', maxWidth: 800, mx: 'auto', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* כותרת וכפתורי פעולה */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <Typography variant="h6">
          חשבונית מס'{' '}
          <Typography component="span" fontWeight="bold">
            {invoiceData.invoiceNumber}
          </Typography>
        </Typography>
        
        <Box>
          <Tooltip title="הורדה">
            <IconButton onClick={handleDownload} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="הדפסה">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* תצוגת ה-PDF */}
      {pdfUrl && (
        <Box sx={{ height: '80vh', width: '100%' }}>
          <iframe
            src={`${process.env.REACT_APP_API_URL || ''}${pdfUrl}`}
            width="100%"
            height="100%"
            title="תצוגה מקדימה של החשבונית"
            style={{ border: 'none' }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default InvoicePreview; 