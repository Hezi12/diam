import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Chip,
  ListItem,
  List,
  ListItemText,
  Divider
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * מודל לייבוא הוצאות מקובץ אקסל
 * @param {Object} props - פרופסים של הקומפוננטה
 * @param {boolean} props.open - האם המודל פתוח
 * @param {Function} props.onClose - פונקציה לסגירת המודל
 * @param {Function} props.onSave - פונקציה לשמירת ההוצאות
 * @param {Array} props.expenseCategories - קטגוריות ההוצאות
 * @param {Array} props.paymentMethods - אמצעי התשלום
 * @param {string} props.currentLocation - המיקום הנוכחי (rothschild/airport)
 */
const ImportExpensesModal = ({ 
  open, 
  onClose, 
  onSave, 
  expenseCategories, 
  paymentMethods, 
  currentLocation 
}) => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // הגדרות זיהוי קטגוריות
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categoryKeywords, setCategoryKeywords] = useState(() => {
    // טעינה מ-localStorage אם קיים
    const saved = localStorage.getItem('categoryKeywords');
    return saved ? JSON.parse(saved) : {};
  });
  const [currentCategory, setCurrentCategory] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  
  // שמירת הגדרות מילות המפתח ב-localStorage בכל פעם שהן משתנות
  useEffect(() => {
    localStorage.setItem('categoryKeywords', JSON.stringify(categoryKeywords));
  }, [categoryKeywords]);
  
  // אפס את הטופס בעת פתיחת המודל
  useEffect(() => {
    if (!open) {
      setExpenses([]);
      setSelectedFile(null);
      setError('');
    }
  }, [open]);

  /**
   * פיענוח תאריך מתוך תא באקסל
   * @param {any} value - ערך התא
   * @returns {string} תאריך בפורמט yyyy-MM-dd
   */
  const parseDateFromExcel = (value) => {
    if (!value) return format(new Date(), 'yyyy-MM-dd');
    
    try {
      // נסה לפרסר את התאריך ממחרוזת
      if (typeof value === 'string') {
        const dateParts = value.split('/');
        if (dateParts.length === 3) {
          // אם התאריך בפורמט dd/MM/yyyy
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          let year = parseInt(dateParts[2], 10);
          
          // טיפול בפורמט שנה דו-ספרתי
          if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year;
          }
          
          const date = new Date(year, month, day);
          return format(date, 'yyyy-MM-dd');
        }
      }
      
      // אם התאריך הוא אובייקט תאריך של אקסל
      if (typeof value === 'number') {
        // המרה ממספר סידורי של אקסל לתאריך JavaScript
        const date = new Date((value - 25569) * 86400 * 1000);
        return format(date, 'yyyy-MM-dd');
      }
      
      return format(new Date(value), 'yyyy-MM-dd');
    } catch (error) {
      console.error('שגיאה בפיענוח תאריך:', error);
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  /**
   * זיהוי קטגוריה לפי מילות מפתח
   * @param {string} description - תיאור ההוצאה
   * @returns {string} הקטגוריה המזוהה או ריק אם לא זוהתה קטגוריה
   */
  const identifyCategoryByKeywords = (description) => {
    if (!description) return '';
    
    // המרה לאותיות קטנות לצורך השוואה מדויקת יותר
    const lowerDesc = description.toLowerCase();
    
    // בדיקת כל קטגוריה ומילות המפתח שלה
    for (const category in categoryKeywords) {
      const keywords = categoryKeywords[category];
      
      // בדיקה אם התיאור מכיל את אחת ממילות המפתח
      if (keywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    
    return ''; // לא נמצאה קטגוריה מתאימה
  };

  /**
   * טיפול בהעלאת קובץ אקסל
   * @param {Event} event - אירוע העלאת הקובץ
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setIsLoading(true);
    setError('');
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // קבלת גיליון העבודה הראשון
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // המרת הגיליון לפורמט JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // זיהוי העמודות
        let dateColumnIndex = -1;
        let amountColumnIndex = -1;
        let descriptionColumnIndex = -1;
        
        // חיפוש באמצעות שורת הכותרות או מציאת עמודות לפי ההיגיון
        const headerRow = jsonData[0] || [];
        
        for (let i = 0; i < headerRow.length; i++) {
          const header = String(headerRow[i] || '').toLowerCase();
          
          if (header.includes('תאריך') || header.includes('date')) {
            dateColumnIndex = i;
          } else if (
            header.includes('סכום') || 
            header.includes('חיוב') || 
            header.includes('amount') ||
            header.includes('sum')
          ) {
            amountColumnIndex = i;
          } else if (
            header.includes('תיאור') || 
            header.includes('פרטים') || 
            header.includes('description') ||
            header.includes('details')
          ) {
            descriptionColumnIndex = i;
          }
        }
        
        // אם לא זוהו העמודות הדרושות, ננסה לזהות לפי תוכן
        if (amountColumnIndex === -1) {
          // חיפוש עמודת סכום לפי ערכים מספריים
          for (let i = 0; i < headerRow.length; i++) {
            if (jsonData.length > 1 && typeof jsonData[1][i] === 'number') {
              amountColumnIndex = i;
              break;
            }
          }
        }
        
        if (dateColumnIndex === -1) {
          // עמודה ראשונה או שנייה בדרך כלל מכילה תאריכים
          dateColumnIndex = 0;
        }
        
        if (descriptionColumnIndex === -1) {
          // חיפוש עמודה שמכילה טקסט ארוך יחסית
          for (let i = 0; i < headerRow.length; i++) {
            if (i !== dateColumnIndex && i !== amountColumnIndex) {
              descriptionColumnIndex = i;
              break;
            }
          }
        }
        
        // המרת הנתונים להוצאות
        const importedExpenses = [];
        
        // דילוג על שורת הכותרת
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // דילוג על שורות ריקות
          if (!row || row.length === 0) continue;
          
          // קבלת הערכים
          const amount = row[amountColumnIndex];
          const dateValue = row[dateColumnIndex];
          const description = row[descriptionColumnIndex];
          
          // דילוג על שורות ללא סכום
          if (!amount || isNaN(Number(amount))) continue;
          
          // זיהוי קטגוריה אוטומטי לפי מילות מפתח
          const identifiedCategory = identifyCategoryByKeywords(description);
          
          // יצירת הוצאה
          importedExpenses.push({
            amount: Math.abs(Number(amount)), // וידוא שהסכום הוא חיובי
            description: description || 'ייבוא מאקסל',
            date: parseDateFromExcel(dateValue),
            category: identifiedCategory, // שימוש בקטגוריה שזוהתה אוטומטית
            location: currentLocation,
            paymentMethod: 'transfer_mizrahi', // ברירת מחדל - "העברה מזרחי"
            isRecurring: false,
            id: `imported-${i}` // מזהה זמני
          });
        }
        
        setExpenses(importedExpenses);
        
        if (importedExpenses.length === 0) {
          setError('לא נמצאו נתוני הוצאות תקינים בקובץ');
        }
      } catch (error) {
        console.error('שגיאה בפיענוח קובץ האקסל:', error);
        setError('שגיאה בפיענוח קובץ האקסל');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('שגיאה בקריאת הקובץ');
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  /**
   * עדכון קטגוריית הוצאה
   * @param {string} id - מזהה ההוצאה 
   * @param {string} category - הקטגוריה החדשה
   */
  const handleCategoryChange = (id, category) => {
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === id ? { ...expense, category } : expense
      )
    );
  };

  /**
   * עדכון סוג תשלום
   * @param {string} id - מזהה ההוצאה
   * @param {string} paymentMethod - סוג התשלום החדש
   */
  const handlePaymentMethodChange = (id, paymentMethod) => {
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === id ? { ...expense, paymentMethod } : expense
      )
    );
  };

  /**
   * הסרת הוצאה מהרשימה
   * @param {string} id - מזהה ההוצאה להסרה
   */
  const handleRemoveExpense = (id) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
  };

  /**
   * שמירת ההוצאות ושליחה לשרת
   */
  const handleSaveExpenses = () => {
    // יש לוודא שכל ההוצאות משויכות לקטגוריה
    const hasUnassignedCategories = expenses.some(expense => !expense.category);
    
    if (hasUnassignedCategories) {
      setError('יש לשייך את כל ההוצאות לקטגוריה לפני השמירה');
      return;
    }
    
    if (expenses.length === 0) {
      setError('אין הוצאות לשמירה');
      return;
    }
    
    // שליחת ההוצאות לקומפוננטת האב
    onSave(expenses);
  };

  /**
   * פתיחת מודל הגדרות קטגוריות
   */
  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  /**
   * הוספת מילת מפתח חדשה לקטגוריה
   */
  const handleAddKeyword = () => {
    if (!currentCategory || !newKeyword.trim()) {
      return;
    }

    setCategoryKeywords(prev => {
      const updatedKeywords = { ...prev };
      if (!updatedKeywords[currentCategory]) {
        updatedKeywords[currentCategory] = [];
      }
      
      // הוספת מילת המפתח אם היא לא קיימת כבר
      if (!updatedKeywords[currentCategory].includes(newKeyword.trim())) {
        updatedKeywords[currentCategory] = [...updatedKeywords[currentCategory], newKeyword.trim()];
      }
      
      return updatedKeywords;
    });
    
    setNewKeyword('');
  };

  /**
   * הסרת מילת מפתח מקטגוריה
   */
  const handleRemoveKeyword = (category, keyword) => {
    setCategoryKeywords(prev => {
      const updatedKeywords = { ...prev };
      updatedKeywords[category] = updatedKeywords[category].filter(kw => kw !== keyword);
      
      // אם אין מילות מפתח, מחיקת הקטגוריה
      if (updatedKeywords[category].length === 0) {
        delete updatedKeywords[category];
      }
      
      return updatedKeywords;
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InsertDriveFileIcon sx={{ mr: 1 }} />
            <Typography variant="h6">ייבוא הוצאות מאקסל</Typography>
          </Box>
          <Box>
            <Tooltip title="הגדרות זיהוי אוטומטי">
              <IconButton onClick={handleOpenSettings} size="small" sx={{ mr: 1 }}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    sx={{ mr: 2 }}
                    color="primary"
                  >
                    בחר קובץ אקסל
                    <input
                      type="file"
                      hidden
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                    />
                  </Button>
                  {selectedFile && (
                    <Typography variant="body2">
                      {selectedFile.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              {expenses.length > 0 && (
                <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">
                    נמצאו {expenses.length} הוצאות לייבוא
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : expenses.length > 0 ? (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="15%">תאריך</TableCell>
                    <TableCell width="15%">סכום</TableCell>
                    <TableCell width="25%">תיאור</TableCell>
                    <TableCell width="20%">קטגוריה</TableCell>
                    <TableCell width="20%">אמצעי תשלום</TableCell>
                    <TableCell width="5%">פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.amount.toLocaleString()} ₪</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={expense.category}
                            onChange={(e) => handleCategoryChange(expense.id, e.target.value)}
                            displayEmpty
                            error={!expense.category}
                          >
                            <MenuItem value="" disabled>
                              בחר קטגוריה
                            </MenuItem>
                            {expenseCategories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={expense.paymentMethod}
                            onChange={(e) => handlePaymentMethodChange(expense.id, e.target.value)}
                          >
                            {paymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                {method.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="הסר">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveExpense(expense.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : selectedFile ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary">
                לא נמצאו נתוני הוצאות בקובץ
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary">
                בחר קובץ אקסל לייבוא הוצאות
              </Typography>
              <Typography variant="caption" color="text.secondary">
                הקובץ צריך להכיל עמודות של תאריך, סכום ותיאור
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveExpenses}
            startIcon={<SaveIcon />}
            disabled={expenses.length === 0}
          >
            שמור הוצאות
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג הגדרות זיהוי קטגוריות */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">הגדרות זיהוי אוטומטי של קטגוריות</Typography>
          <IconButton onClick={() => setSettingsOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            הגדר מילות מפתח לכל קטגוריה. כאשר מילת מפתח מופיעה בתיאור ההוצאה, המערכת תזהה אוטומטית את הקטגוריה.
          </Typography>

          {/* טופס הוספת מילת מפתח */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl sx={{ width: '30%' }}>
              <InputLabel>קטגוריה</InputLabel>
              <Select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                label="קטגוריה"
              >
                {expenseCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              sx={{ width: '50%' }}
              label="מילת מפתח"
              variant="outlined"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="לדוגמא: בוקינג, אקספדיה"
              disabled={!currentCategory}
            />
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddKeyword}
              disabled={!currentCategory || !newKeyword.trim()}
            >
              הוסף
            </Button>
          </Box>

          {/* רשימת הקטגוריות ומילות המפתח */}
          <Box>
            {Object.keys(categoryKeywords).length > 0 ? (
              <List sx={{ bgcolor: 'background.paper' }}>
                {Object.entries(categoryKeywords).map(([category, keywords]) => (
                  <React.Fragment key={category}>
                    <ListItem
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={category}
                        secondary={
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {keywords.map((keyword) => (
                              <Chip
                                key={keyword}
                                label={keyword}
                                size="small"
                                onDelete={() => handleRemoveKeyword(category, keyword)}
                                color="primary"
                              />
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider sx={{ my: 1 }} />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary">
                  אין עדיין הגדרות זיהוי אוטומטי. הוסף מילות מפתח לקטגוריות.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={() => setSettingsOpen(false)}
          >
            סגור
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImportExpensesModal; 