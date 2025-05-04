import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
  TextField,
  Chip,
  Dialog,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CreateInvoiceDialog from '../components/invoices/CreateInvoiceDialog';
import { STYLE_CONSTANTS } from '../styles/StyleConstants';
import { useNavigate } from 'react-router-dom';
import invoiceService from '../services/invoiceService';

const documentTypesHebrew = {
  invoice: 'חשבונית מס',
  invoice_receipt: 'חשבונית מס/קבלה',
  credit_invoice: 'חשבונית זיכוי'
};

const statusesHebrew = {
  active: 'פעילה',
  canceled: 'מבוטלת',
  replaced: 'הוחלפה'
};

const statusColors = {
  active: {
    bg: '#e6f4ea',
    color: '#0a652d'
  },
  canceled: {
    bg: '#fce8e6',
    color: '#c5221f'
  },
  replaced: {
    bg: '#e8eaed',
    color: '#3c4043'
  }
};

/**
 * דף ניהול חשבוניות
 */
const Invoices = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const colors = STYLE_CONSTANTS.colors;
  
  // הגדרת שפה
  const [isEnglish, setIsEnglish] = useState(false);
  
  // מצב נתוני חשבוניות
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  
  // מצב סינון וחיפוש
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    fromDate: null,
    toDate: null,
    minAmount: '',
    maxAmount: '',
    documentType: '',
    location: ''
  });
  
  // מצב טעינה
  const [loading, setLoading] = useState(false);
  
  // מצב דיאלוגים
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState(null);
  
  // מצב רענון
  const [refresh, setRefresh] = useState(false);
  
  // פונקציה לטעינת החשבוניות מהשרת - חייבת להיות מוגדרת לפני השימוש ב-useEffect
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage
      }).toString();

      const response = await axios.get(`/api/invoices?${queryParams}`);
      
      console.log('תשובה מהשרת - חשבוניות:', response.data);
      console.log('מבנה התשובה:', {
        האם_יש_מערך: Array.isArray(response.data),
        האם_יש_שדה_invoices: response.data && response.data.invoices,
        האם_יש_שדה_total: response.data && response.data.total
      });
      
      if (Array.isArray(response.data)) {
        // אם התשובה היא מערך ישיר של חשבוניות
        setInvoices(response.data);
        setTotal(response.data.length);
      } else if (response.data && response.data.invoices) {
        // אם התשובה במבנה {invoices: [...], total: X}
        setInvoices(response.data.invoices);
        setTotal(response.data.total || response.data.invoices.length);
      } else {
        // אין מבנה מוכר
        console.error('מבנה תשובה לא מוכר:', response.data);
        setInvoices([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('שגיאה בטעינת חשבוניות:', error);
      enqueueSnackbar(
        isEnglish ? 'Error loading invoices' : 'שגיאה בטעינת חשבוניות',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, isEnglish, enqueueSnackbar]);
  
  // אפקט לטעינת חשבוניות - רק אחרי שהפונקציה הוגדרה לעיל
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refresh]);
  
  // טיפול בשינוי דף
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // טיפול בשינוי מספר שורות בדף
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // איפוס כל הפילטרים
  const handleResetFilters = () => {
    setFilters({
      status: '',
      fromDate: null,
      toDate: null,
      minAmount: '',
      maxAmount: '',
      documentType: '',
      location: ''
    });
    setSearchTerm('');
    setPage(0);
  };
  
  // הורדת חשבונית
  const handleDownloadInvoice = async (id, invoiceNumber) => {
    try {
      const response = await axios.get(`/api/invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `חשבונית-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      enqueueSnackbar(
        isEnglish ? 'Invoice downloaded successfully' : 'החשבונית הורדה בהצלחה',
        { variant: 'success' }
      );
    } catch (error) {
      console.error('שגיאה בהורדת החשבונית:', error);
      enqueueSnackbar(
        isEnglish ? 'Error downloading invoice' : 'שגיאה בהורדת החשבונית',
        { variant: 'error' }
      );
    }
  };
  
  // פתיחת דיאלוג אישור ביטול חשבונית
  const handleOpenCancelDialog = (invoice) => {
    setInvoiceToCancel(invoice);
    setCancelConfirmOpen(true);
  };
  
  // ביטול חשבונית
  const handleCancelInvoice = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל חשבונית זו?')) {
      try {
        await invoiceService.cancelInvoice(id);
        setRefresh(prev => !prev);
        enqueueSnackbar('החשבונית בוטלה בהצלחה', { variant: 'success' });
      } catch (error) {
        console.error('שגיאה בביטול החשבונית:', error);
        enqueueSnackbar(`שגיאה בביטול החשבונית: ${error.message || 'נסה שוב מאוחר יותר'}`, { variant: 'error' });
      }
    }
  };
  
  // יצירת חשבונית זיכוי
  const handleCreditInvoice = async (id) => {
    try {
      await invoiceService.createCreditInvoice(id);
      setRefresh(prev => !prev);
      enqueueSnackbar('חשבונית זיכוי נוצרה בהצלחה', { variant: 'success' });
    } catch (error) {
      console.error('שגיאה ביצירת חשבונית זיכוי:', error);
      enqueueSnackbar(`שגיאה ביצירת חשבונית זיכוי: ${error.message || 'נסה שוב מאוחר יותר'}`, { variant: 'error' });
    }
  };
  
  // פורמט תאריך
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };
  
  // פורמט סכום
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '-';
    
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // פורמט מספר חשבונית
  const formatInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber) return '-';
    
    // מספר חשבונית בפורמט החדש: NNNN-XX
    // מציג את המספר כפי שהוא
    return invoiceNumber;
  };

  // הרנדור של דיאלוג הסינון
  const renderFilterDialog = () => (
    <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
      <DialogTitle>
        {isEnglish ? 'Filter Invoices' : 'סינון חשבוניות'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, pt: 1 }}>
          {/* סטטוס */}
          <FormControl fullWidth>
            <InputLabel>{isEnglish ? 'Status' : 'סטטוס'}</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              label={isEnglish ? 'Status' : 'סטטוס'}
            >
              <MenuItem value="">{isEnglish ? 'All' : 'הכל'}</MenuItem>
              <MenuItem value="active">{isEnglish ? 'Active' : 'פעילה'}</MenuItem>
              <MenuItem value="canceled">{isEnglish ? 'Canceled' : 'מבוטלת'}</MenuItem>
              <MenuItem value="replaced">{isEnglish ? 'Replaced' : 'הוחלפה'}</MenuItem>
            </Select>
          </FormControl>
          
          {/* סוג מסמך */}
          <FormControl fullWidth>
            <InputLabel>{isEnglish ? 'Document Type' : 'סוג מסמך'}</InputLabel>
            <Select
              value={filters.documentType}
              onChange={(e) => setFilters({...filters, documentType: e.target.value})}
              label={isEnglish ? 'Document Type' : 'סוג מסמך'}
            >
              <MenuItem value="">{isEnglish ? 'All' : 'הכל'}</MenuItem>
              <MenuItem value="invoice">{isEnglish ? 'Invoice' : 'חשבונית מס'}</MenuItem>
              <MenuItem value="invoice_receipt">{isEnglish ? 'Invoice/Receipt' : 'חשבונית מס/קבלה'}</MenuItem>
              <MenuItem value="credit_invoice">{isEnglish ? 'Credit Invoice' : 'חשבונית זיכוי'}</MenuItem>
            </Select>
          </FormControl>
          
          {/* מיקום */}
          <FormControl fullWidth>
            <InputLabel>{isEnglish ? 'Location' : 'מיקום'}</InputLabel>
            <Select
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              label={isEnglish ? 'Location' : 'מיקום'}
            >
              <MenuItem value="">{isEnglish ? 'All' : 'הכל'}</MenuItem>
              <MenuItem value="airport">{isEnglish ? 'Or Yehuda' : 'אור יהודה'}</MenuItem>
              <MenuItem value="rothschild">{isEnglish ? 'Rothschild' : 'רוטשילד'}</MenuItem>
            </Select>
          </FormControl>
          
          {/* תאריכים */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label={isEnglish ? 'From Date' : 'מתאריך'}
              value={filters.fromDate}
              onChange={(date) => setFilters({...filters, fromDate: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            <DatePicker
              label={isEnglish ? 'To Date' : 'עד תאריך'}
              value={filters.toDate}
              onChange={(date) => setFilters({...filters, toDate: date})}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Box>
          
          {/* טווח סכומים */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={isEnglish ? 'Min Amount' : 'סכום מינימלי'}
              type="number"
              value={filters.minAmount}
              onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
              fullWidth
            />
            <TextField
              label={isEnglish ? 'Max Amount' : 'סכום מקסימלי'}
              type="number"
              value={filters.maxAmount}
              onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
              fullWidth
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleResetFilters} color="inherit">
          {isEnglish ? 'Reset' : 'אפס'}
        </Button>
        <Button onClick={() => setFilterOpen(false)} color="primary">
          {isEnglish ? 'Apply Filters' : 'החל סינון'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* כותרת ראשית */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ניהול חשבוניות
        </Typography>
        
        {/* כפתור יצירת חשבונית */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateInvoiceDialogOpen(true)}
          sx={{
            bgcolor: colors.accent.green,
            '&:hover': { bgcolor: '#058c61' }
          }}
        >
          חשבונית חדשה
        </Button>
      </Box>
      
      {/* אזור חיפוש ופילטרים */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* שדה חיפוש */}
          <FormControl variant="outlined" size="small" sx={{ flexGrow: 1, maxWidth: 300 }}>
            <InputLabel>חיפוש לקוח / חשבונית</InputLabel>
            <OutlinedInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              }
              label="חיפוש לקוח / חשבונית"
            />
          </FormControl>
          
          {/* פילטר סטטוס */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>סטטוס</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              label="סטטוס"
            >
              <MenuItem value="">הכל</MenuItem>
              <MenuItem value="active">פעיל</MenuItem>
              <MenuItem value="canceled">מבוטל</MenuItem>
              <MenuItem value="replaced">הוחלף</MenuItem>
            </Select>
          </FormControl>
          
          {/* פילטר סוג מסמך */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>סוג מסמך</InputLabel>
            <Select
              value={filters.documentType}
              onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
              label="סוג מסמך"
            >
              <MenuItem value="">הכל</MenuItem>
              <MenuItem value="invoice">חשבונית מס</MenuItem>
              <MenuItem value="invoice_receipt">חשבונית מס/קבלה</MenuItem>
              <MenuItem value="credit_invoice">חשבונית זיכוי</MenuItem>
            </Select>
          </FormControl>
          
          {/* כפתור פילטרים מתקדמים */}
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            סינון מתקדם
          </Button>
          
          {/* כפתור איפוס פילטרים */}
          <Button
            variant="text"
            color="inherit"
            onClick={handleResetFilters}
          >
            נקה סינון
          </Button>
        </Box>
        
        {/* פילטרים מורחבים */}
        {filterOpen && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, pt: 2, borderTop: '1px solid #eee' }}>
            {/* טווח תאריכים */}
            <DatePicker
              label="מתאריך"
              value={filters.fromDate}
              onChange={(date) => setFilters(prev => ({ ...prev, fromDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
              format="dd/MM/yyyy"
            />
            
            <DatePicker
              label="עד תאריך"
              value={filters.toDate}
              onChange={(date) => setFilters(prev => ({ ...prev, toDate: date }))}
              slotProps={{ textField: { size: 'small' } }}
              format="dd/MM/yyyy"
            />
            
            {/* טווח סכומים */}
            <TextField
              label="סכום מינימלי"
              variant="outlined"
              size="small"
              type="number"
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              sx={{ width: 150 }}
            />
            
            <TextField
              label="סכום מקסימלי"
              variant="outlined"
              size="small"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              sx={{ width: 150 }}
            />
          </Box>
        )}
      </Paper>
      
      {/* טבלת חשבוניות */}
      <Paper sx={{ borderRadius: '8px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>מספר חשבונית</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>תאריך</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>לקוח</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>סוג מסמך</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>סכום</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography>טוען נתונים...</Typography>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography>לא נמצאו חשבוניות</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow 
                    key={invoice._id}
                    sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}
                  >
                    <TableCell align="center">{formatInvoiceNumber(invoice.invoiceNumber)}</TableCell>
                    <TableCell align="center">{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell align="center">{invoice.customer.name}</TableCell>
                    <TableCell align="center">{documentTypesHebrew[invoice.documentType] || invoice.documentType}</TableCell>
                    <TableCell align="center">{formatAmount(invoice.total)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={statusesHebrew[invoice.status] || invoice.status}
                        size="small"
                        sx={{ 
                          backgroundColor: statusColors[invoice.status]?.bg || '#e8eaed',
                          color: statusColors[invoice.status]?.color || '#3c4043',
                          fontWeight: 'medium',
                          fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {/* הורדת PDF */}
                        <Tooltip title="הורד PDF">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleDownloadInvoice(invoice._id, invoice.invoiceNumber)}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {/* ביטול חשבונית */}
                        {invoice.status === 'active' && (
                          <Tooltip title="בטל חשבונית">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenCancelDialog(invoice)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* יצירת חשבונית זיכוי */}
                        {invoice.status === 'active' && invoice.documentType !== 'credit_invoice' && (
                          <Tooltip title="צור חשבונית זיכוי">
                            <IconButton 
                              size="small" 
                              sx={{ color: colors.accent.orange }}
                              onClick={() => handleCreditInvoice(invoice._id)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* דפדוף */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
      
      {/* דיאלוג יצירת חשבונית */}
      <CreateInvoiceDialog
        open={createInvoiceDialogOpen}
        onClose={() => setCreateInvoiceDialogOpen(false)}
        onSave={() => {
          setCreateInvoiceDialogOpen(false);
          setRefresh(prev => !prev);
        }}
      />
      
      {/* דיאלוג אישור ביטול חשבונית */}
      <Dialog open={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)}>
        <Box sx={{ p: 3, minWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>ביטול חשבונית</Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            האם אתה בטוח שברצונך לבטל את חשבונית מספר {invoiceToCancel?.invoiceNumber}?
            <br />
            פעולה זו אינה ניתנת לביטול.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={() => setCancelConfirmOpen(false)}
            >
              ביטול
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => handleCancelInvoice(invoiceToCancel._id)}
            >
              בטל חשבונית
            </Button>
          </Box>
        </Box>
      </Dialog>
      
      {/* דיאלוג סינון */}
      {renderFilterDialog()}
    </Container>
  );
};

export default Invoices; 