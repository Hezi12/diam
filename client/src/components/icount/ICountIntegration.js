import React, { useState } from 'react';
import { TextField, Button, Paper, Grid, Typography, Box, MenuItem, Select, FormControl, InputLabel, Snackbar, Alert, ToggleButtonGroup, ToggleButton } from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import HomeIcon from '@mui/icons-material/Home';
import icountService from '../../services/icountService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const ICountIntegration = () => {
  // בחירת מתחם
  const [location, setLocation] = useState('airport');
  
  // מצב התחברות
  const [credentials, setCredentials] = useState({
    companyId: '',
    username: '',
    password: '',
  });
  
  // מצב חשבונית
  const [invoiceData, setInvoiceData] = useState({
    doctype: 'invoice',
    client_name: '',
    client_email: '',
    items: [
      {
        description: 'לינה במלון',
        quantity: 1,
        unitprice: 0,
      }
    ],
  });
  
  // מצב חיוב אשראי
  const [paymentData, setPaymentData] = useState({
    sum: 0,
    cc_number: '',
    cc_type: '',
    cc_cvv: '',
    cc_validity: '',
    cc_holder_name: '',
  });
  
  // מצב כללי
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // טיפול בשינוי מתחם
  const handleLocationChange = (event, newLocation) => {
    if (newLocation) {
      setLocation(newLocation);
      setIsLoggedIn(false); // איפוס מצב ההתחברות בשינוי מתחם
    }
  };
  
  // טיפול בשינוי שדות
  const handleCredentialsChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    const newItems = [...invoiceData.items];
    newItems[0] = { ...newItems[0], [name]: value };
    setInvoiceData(prev => ({ ...prev, items: newItems }));
  };
  
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };
  
  // התחברות ל-iCount
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await icountService.login(
        location,
        credentials.companyId,
        credentials.username,
        credentials.password
      );
      
      if (response.success) {
        setIsLoggedIn(true);
        setSuccess(`התחברות למתחם ${getLocationName()} בוצעה בהצלחה!`);
      } else {
        setError('שגיאה בהתחברות');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };
  
  // יצירת חשבונית
  const handleCreateInvoice = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await icountService.createInvoice(location, invoiceData);
      
      if (response.success) {
        setSuccess('חשבונית נוצרה בהצלחה!');
      } else {
        setError('שגיאה ביצירת חשבונית');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה ביצירת חשבונית');
    } finally {
      setLoading(false);
    }
  };
  
  // חיוב אשראי ויצירת חשבונית
  const handleChargeAndInvoice = async () => {
    setLoading(true);
    setError('');
    
    try {
      // עדכון סכום גם במידע החשבונית כדי שיהיה תואם
      const updatedItems = [...invoiceData.items];
      updatedItems[0].unitprice = paymentData.sum;
      
      const clientData = {
        client_name: invoiceData.client_name,
        client_email: invoiceData.client_email,
      };
      
      const response = await icountService.chargeAndCreateInvoice(
        location,
        clientData,
        paymentData,
        {
          ...invoiceData,
          items: updatedItems,
        }
      );
      
      if (response.success) {
        setSuccess('חיוב וחשבונית בוצעו בהצלחה!');
      } else {
        setError('שגיאה בחיוב ויצירת חשבונית');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בחיוב ויצירת חשבונית');
    } finally {
      setLoading(false);
    }
  };
  
  // בדיקת מצב התחברות
  const handleCheckConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await icountService.checkConnection(location);
      
      if (response.status === 'success') {
        setIsLoggedIn(true);
        setSuccess(`החיבור למתחם ${getLocationName()} תקין. מזהה סשן: ${response.sessionId}`);
      } else {
        setError(`שגיאה בחיבור: ${response.message}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בבדיקת מצב התחברות');
    } finally {
      setLoading(false);
    }
  };
  
  // פונקציה מעזר - שם המתחם המוצג למשתמש
  const getLocationName = () => {
    return location === 'airport' ? 'Airport Guest House' : 'רוטשילד';
  };
  
  // סגירת התראה
  const handleCloseAlert = () => {
    setError('');
    setSuccess('');
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        אינטגרציה עם iCount
      </Typography>
      
      {/* בחירת מתחם */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ToggleButtonGroup
          value={location}
          exclusive
          onChange={handleLocationChange}
          aria-label="בחירת מתחם"
          dir="rtl"
        >
          <ToggleButton value="rothschild" aria-label="רוטשילד">
            <HomeIcon sx={{ ml: 1 }} />
            <Typography>רוטשילד</Typography>
          </ToggleButton>
          <ToggleButton value="airport" aria-label="Airport Guest House">
            <FlightIcon sx={{ ml: 1 }} />
            <Typography>Airport Guest House</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* התחברות */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          התחברות למתחם {getLocationName()}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="companyId"
              label="מזהה חברה"
              value={credentials.companyId}
              onChange={handleCredentialsChange}
              disabled={isLoggedIn}
              dir="rtl"
              placeholder={location === 'airport' ? 'Airport' : 'diamhotels'}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="username"
              label="שם משתמש"
              value={credentials.username}
              onChange={handleCredentialsChange}
              disabled={isLoggedIn}
              dir="rtl"
              placeholder="diamhotels"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              name="password"
              label="סיסמה"
              type="password"
              value={credentials.password}
              onChange={handleCredentialsChange}
              disabled={isLoggedIn}
              dir="rtl"
              placeholder="Hezil3225"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              disabled={loading || isLoggedIn}
              fullWidth
            >
              {isLoggedIn ? `מחובר למתחם ${getLocationName()}` : 'התחבר'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCheckConnection}
              disabled={loading}
              fullWidth
            >
              בדיקת מצב התחברות
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="info"
              onClick={async () => {
                setLoading(true);
                setError('');
                try {
                  const response = await axios.get(`${API_URL}/api/icount/test-connection/${location}`);
                  setSuccess(`בוצעו ${response.data.tests.length} בדיקות. תוצאות: ${JSON.stringify(response.data)}`);
                } catch (err) {
                  setError(err.response?.data?.error || 'שגיאה בבדיקת אפשרויות התחברות');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              fullWidth
            >
              בדיקת כל אפשרויות ההתחברות
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* פרטי חשבונית וחיוב */}
      {isLoggedIn && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            יצירת חשבונית ותשלום
          </Typography>
          
          <Grid container spacing={3}>
            {/* פרטי לקוח */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="client_name"
                label="שם לקוח"
                value={invoiceData.client_name}
                onChange={handleInvoiceChange}
                dir="rtl"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="client_email"
                label="אימייל לקוח"
                value={invoiceData.client_email}
                onChange={handleInvoiceChange}
                dir="rtl"
              />
            </Grid>
            
            {/* פרטי מוצר */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                name="description"
                label="תיאור מוצר/שירות"
                value={invoiceData.items[0].description}
                onChange={handleItemChange}
                dir="rtl"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="quantity"
                label="כמות"
                type="number"
                value={invoiceData.items[0].quantity}
                onChange={handleItemChange}
                dir="rtl"
              />
            </Grid>
            
            {/* פרטי תשלום */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                פרטי תשלום
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="sum"
                label="סכום לחיוב"
                type="number"
                value={paymentData.sum}
                onChange={handlePaymentChange}
                dir="rtl"
              />
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                name="cc_number"
                label="מספר כרטיס אשראי"
                value={paymentData.cc_number}
                onChange={handlePaymentChange}
                dir="rtl"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="cc-type-label">סוג כרטיס</InputLabel>
                <Select
                  labelId="cc-type-label"
                  name="cc_type"
                  value={paymentData.cc_type}
                  onChange={handlePaymentChange}
                  label="סוג כרטיס"
                >
                  <MenuItem value="isracard">ישראכארט</MenuItem>
                  <MenuItem value="visa">ויזה</MenuItem>
                  <MenuItem value="mastercard">מאסטרקארד</MenuItem>
                  <MenuItem value="amex">אמריקן אקספרס</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="cc_cvv"
                label="CVV"
                value={paymentData.cc_cvv}
                onChange={handlePaymentChange}
                dir="rtl"
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="cc_validity"
                label="תוקף (MMYY)"
                value={paymentData.cc_validity}
                onChange={handlePaymentChange}
                dir="rtl"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="cc_holder_name"
                label="שם בעל הכרטיס"
                value={paymentData.cc_holder_name}
                onChange={handlePaymentChange}
                dir="rtl"
              />
            </Grid>
            
            {/* כפתורי פעולה */}
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleCreateInvoice}
                disabled={loading}
              >
                יצירת חשבונית בלבד
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleChargeAndInvoice}
                disabled={loading}
              >
                חיוב אשראי ויצירת חשבונית
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* התראות */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ICountIntegration; 