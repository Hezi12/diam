import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  Button, 
  Typography, 
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import invoiceService from '../../services/invoiceService';

/**
 * פאנל לניהול מיגרציה של חשבוניות מהמערכת הישנה ל-iCount
 */
const MigrationPanel = () => {
  // מצב המסך
  const [location, setLocation] = useState('rothschild');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [migrationResults, setMigrationResults] = useState(null);

  // אתחול הודעות
  useEffect(() => {
    // נקה הודעות אחרי 5 שניות
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage(null);
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  /**
   * ביצוע מיגרציה המונית לפי הפרמטרים שהוגדרו
   */
  const handleBulkMigration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      setMigrationResults(null);
      
      const results = await invoiceService.bulkMigrateToICount(
        location, 
        dateFrom, 
        dateTo
      );
      
      setMigrationResults(results.results);
      setMessage(`המיגרציה הושלמה בהצלחה: ${results.results.success} מתוך ${results.results.total} חשבוניות הועברו`);
    } catch (err) {
      setError(`שגיאה בביצוע המיגרציה: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * העברת חשבונית בודדת ל-iCount
   */
  const handleSingleMigration = async () => {
    try {
      const invoiceId = prompt('הזן את מזהה החשבונית להעברה:');
      
      if (!invoiceId) return;
      
      setIsLoading(true);
      setError(null);
      setMessage(null);
      
      const result = await invoiceService.migrateInvoiceToICount(invoiceId, location);
      
      setMessage(`חשבונית ${result.invoice.invoiceNumber} הועברה בהצלחה ל-iCount`);
    } catch (err) {
      setError(`שגיאה בהעברת החשבונית: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Card variant="outlined">
        <CardHeader 
          title="מיגרציה של חשבוניות ל-iCount" 
          subheader="העברת חשבוניות מהמערכת הישנה למערכת iCount"
        />
        <CardContent>
          {(message || error) && (
            <Box mb={3}>
              {message && <Alert severity="success">{message}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel>מתחם</InputLabel>
                  <Select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    label="מתחם"
                  >
                    <MenuItem value="rothschild">רוטשילד</MenuItem>
                    <MenuItem value="airport">אור יהודה</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ mb: 2 }}>
                  <DatePicker
                    label="מתאריך"
                    value={dateFrom}
                    onChange={setDateFrom}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <DatePicker
                    label="עד תאריך"
                    value={dateTo}
                    onChange={setDateTo}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Box>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleBulkMigration}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'העברה המונית'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleSingleMigration}
                    disabled={isLoading}
                  >
                    העברת חשבונית בודדת
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {migrationResults && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    תוצאות המיגרציה
                  </Typography>
                  <Typography>
                    סך הכל: {migrationResults.total} חשבוניות
                  </Typography>
                  <Typography>
                    הועברו בהצלחה: {migrationResults.success} חשבוניות
                  </Typography>
                  <Typography>
                    נכשלו: {migrationResults.failed} חשבוניות
                  </Typography>
                  
                  {migrationResults.errors && migrationResults.errors.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle1">שגיאות:</Typography>
                      <List dense>
                        {migrationResults.errors.map((error, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={`חשבונית ${error.invoiceNumber || error.invoiceId}`}
                              secondary={error.error}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              הערות:
            </Typography>
            <Typography variant="body2">
              • חשבוניות שכבר קיימות במערכת iCount יידלגו
            </Typography>
            <Typography variant="body2">
              • רק חשבוניות פעילות (לא מבוטלות) יועברו
            </Typography>
            <Typography variant="body2">
              • יש לוודא שהפרטים בחשבוניות מלאים ותקינים
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default MigrationPanel; 