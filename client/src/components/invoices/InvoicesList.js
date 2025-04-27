import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  AddCircle as AddCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import axios from 'axios';
import moment from 'moment';
import { Link } from 'react-router-dom';

/**
 * פונקציה להפקת PDF עבור חשבונית
 * @param {string} invoiceId - מזהה החשבונית 
 */
const generateInvoicePdf = async (invoiceId) => {
  try {
    const response = await axios.get(`/api/invoices/${invoiceId}/pdf`);
    return response.data;
  } catch (error) {
    console.error('שגיאה בהפקת PDF:', error);
    throw error;
  }
};

/**
 * רכיב המציג רשימת חשבוניות
 */
const InvoicesList = ({ 
  location, // מיקום (אור יהודה/רוטשילד)
  onViewInvoice, // פונקציה להצגת חשבונית
  onEditInvoice, // פונקציה לעריכת חשבונית
  onCreateInvoice, // פונקציה ליצירת חשבונית חדשה
  onCancelInvoice, // פונקציה לביטול חשבונית
  refreshData // פונקציה לרענון הנתונים
}) => {
  // מצב רשימת החשבוניות
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // מצב דפדוף
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // מצב סינון וחיפוש
  const [filters, setFilters] = useState({
    customer: '',
    status: '',
    fromDate: null,
    toDate: null
  });
  
  // מצב מיון
  const [sortBy, setSortBy] = useState('-createdAt');
  
  // מצב סינון חיפוש נוסף
  const [search, setSearch] = useState('');
  
  // מצב סינון מיון
  const [sortDirection, setSortDirection] = useState('desc');
  
  // מצב סטטוס חשבוניות
  // טעינת החשבוניות
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('מנסה לטעון חשבוניות עם הפרמטרים:', { 
        location,
        status: filters.status,
        customer: filters.customer
      });
      
      // בניית פרמטרים לשאילתה
      const params = { location };
      
      if (filters.customer) params.customer = filters.customer;
      if (filters.status) params.status = filters.status;
      if (filters.fromDate) params.fromDate = moment(filters.fromDate).format('YYYY-MM-DD');
      if (filters.toDate) params.toDate = moment(filters.toDate).format('YYYY-MM-DD');
      if (sortBy) {
        // נמנע מכפל מינוסים - ב-createdAt יש כבר מינוס
        if (sortBy === '-createdAt') {
          params.sort = sortDirection === 'desc' ? '-createdAt' : 'createdAt';
        } else {
          params.sort = sortDirection === 'desc' ? `-${sortBy}` : sortBy;
        }
      }
      
      const response = await axios.get('/api/invoices', { params });
      console.log('תשובה מהשרת:', response.data);
      
      if (response.data) {
        // אם התגובה היא מערך, השתמש בו ישירות, אחרת בדוק אם יש שדה data
        const invoicesData = Array.isArray(response.data) ? 
          response.data : 
          (response.data.data ? response.data.data : []);
          
        setInvoices(invoicesData);
      } else {
        setInvoices([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('שגיאה בטעינת חשבוניות:', err);
      setError('אירעה שגיאה בטעינת החשבוניות. אנא נסה שנית.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [location, filters, sortBy, sortDirection]);
  
  // טעינת חשבוניות בעת טעינת הרכיב או שינוי בפילטרים
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refreshData]);
  
  // טיפול בשינוי פילטרים
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0); // חזרה לעמוד הראשון בעת שינוי פילטר
  };
  
  // טיפול בשינוי תאריך
  const handleDateChange = (name, date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
    setPage(0);
  };
  
  // טיפול בשינוי עמוד
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // טיפול בשינוי מספר שורות בעמוד
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // מיפוי סטטוס לצ'יפ צבעוני
  const getStatusChip = (status) => {
    const statusMap = {
      'draft': { label: 'טיוטה', color: 'default' },
      'issued': { label: 'הונפק', color: 'success' },
      'cancelled': { label: 'בוטל', color: 'error' },
      'void': { label: 'מבוטל', color: 'error' }
    };
    
    const { label, color } = statusMap[status] || { label: status, color: 'default' };
    
    return (
      <Chip 
        label={label} 
        color={color} 
        size="small" 
        variant="outlined"
      />
    );
  };
  
  // פעולת הורדת חשבונית - שונתה לניווט לדף פרטי החשבונית
  const handleDownload = (invoiceId) => {
    try {
      console.log('מעביר לדף פרטי החשבונית:', invoiceId);
      // במקום הורדה - ניווט לדף פרטי החשבונית
      onViewInvoice(invoiceId);
    } catch (error) {
      console.error('שגיאה בניווט לדף החשבונית:', error);
      alert('אירעה שגיאה בניסיון להציג את החשבונית');
    }
  };
  
  return (
    <Box>
      {/* כותרת ופקדי פעולה */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          ניהול חשבוניות
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddCircleIcon />}
          onClick={onCreateInvoice}
        >
          חשבונית חדשה
        </Button>
      </Box>
      
      {/* אזור חיפוש וסינון */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="חיפוש לקוח"
              name="customer"
              value={filters.customer}
              onChange={handleFilterChange}
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>סטטוס</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="סטטוס"
              >
                <MenuItem value="">הכל</MenuItem>
                <MenuItem value="draft">טיוטה</MenuItem>
                <MenuItem value="issued">הונפק</MenuItem>
                <MenuItem value="cancelled">בוטל</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="מתאריך"
                value={filters.fromDate}
                onChange={(date) => handleDateChange('fromDate', date)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    fullWidth: true 
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
              <DatePicker
                label="עד תאריך"
                value={filters.toDate}
                onChange={(date) => handleDateChange('toDate', date)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    fullWidth: true 
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>
      
      {/* רשימת החשבוניות */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="טבלת חשבוניות">
            <TableHead>
              <TableRow>
                <TableCell>מס' חשבונית</TableCell>
                <TableCell>תאריך</TableCell>
                <TableCell>לקוח</TableCell>
                <TableCell>מס' הזמנה</TableCell>
                <TableCell>סכום</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell align="center">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">טוען נתונים...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'error.main' }}>
                    {error}
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">לא נמצאו חשבוניות</TableCell>
                </TableRow>
              ) : (
                invoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((invoice) => (
                    <TableRow 
                      key={invoice._id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {moment(invoice.issueDate).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>{invoice.customer.name}</TableCell>
                      <TableCell>
                        {invoice.booking && invoice.booking.bookingNumber 
                          ? invoice.booking.bookingNumber 
                          : '-'}
                      </TableCell>
                      <TableCell>₪{invoice.paymentDetails.total.toLocaleString()}</TableCell>
                      <TableCell>{getStatusChip(invoice.status)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="פרטים מלאים">
                            <IconButton 
                              size="small"
                              color="primary"
                              component={Link}
                              to={`/invoices/${invoice._id}`}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="הורדת PDF">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleDownload(invoice._id)}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {invoice.status !== 'cancelled' && invoice.status !== 'void' && (
                            <Tooltip title="ביטול חשבונית">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => onCancelInvoice(invoice._id)}
                              >
                                <CancelIcon fontSize="small" />
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
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={invoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="שורות בעמוד:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        />
      </Paper>
    </Box>
  );
};

export default InvoicesList; 