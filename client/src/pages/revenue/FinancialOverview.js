import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  useTheme,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Tooltip,
  alpha,
  useMediaQuery,
  LinearProgress
} from '@mui/material';
import { format, startOfMonth, getMonth, getYear } from 'date-fns';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PieChartIcon from '@mui/icons-material/PieChart';

// קומפוננטות לתצוגת הדוח
import RevenueDateNavigation from '../../components/revenue/RevenueDateNavigation';
import RevenueTabs from '../../components/revenue/RevenueTabs';
import PaymentMethodChart from '../../components/revenue/PaymentMethodChart';
import RevenueSummaryCards from '../../components/revenue/RevenueSummaryCards';
import ExpensesList from '../../components/revenue/ExpensesList';
import ExpenseCategoryChart from '../../components/revenue/ExpenseCategoryChart';

// סרוויס לקבלת נתונים
import { getMonthlyRevenueData } from '../../services/revenueService';
import { getExpenses, addExpense, deleteExpense } from '../../services/expenseService';

// פאנל לטעינת נתונים
const LoadingPanel = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
    <CircularProgress size={48} thickness={4} sx={{ color: theme => theme.palette.primary.main }} />
  </Box>
);

// קומפוננטת כרטיסייה מידע
const InfoCard = ({ title, value, type = 'default', icon }) => {
  const theme = useTheme();
  
  // הגדרת צבעים לפי הסוג
  const styles = {
    revenue: {
      color: theme.palette.primary.main,
      iconColor: 'primary'
    },
    expense: {
      color: theme.palette.error.main,
      iconColor: 'error'
    },
    profit: {
      color: theme.palette.success.main,
      iconColor: 'success'
    },
    default: {
      color: theme.palette.info.main,
      iconColor: 'info'
    }
  };
  
  const style = styles[type];
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2.5, 
        height: '100%', 
        borderRadius: 2, 
        boxShadow: theme.shadows[1],
        borderLeft: '4px solid', 
        borderColor: style.color,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
        {icon && (
          // שימוש בעותק של האייקון עם צבע מתאים
          <Box sx={{ display: 'flex', color: style.color }}>
            {icon}
          </Box>
        )}
      </Box>
      
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </Paper>
  );
};

// כותרת סקשן 
const SectionTitle = ({ title, action }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    mb: 2,
    pb: 1,
    borderBottom: '1px solid',
    borderColor: 'divider'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
    
    {action}
  </Box>
);

// קומפוננטת תצוגת הכנסות לפי אמצעי תשלום מודרנית
const ModernPaymentMethodsDisplay = ({ data }) => {
  const theme = useTheme();
  
  // מיון הנתונים לפי גודל - מהגדול לקטן
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  
  // חישוב סך הכל
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // צבעים לפי סוג אמצעי תשלום
  const getMethodColor = (method) => {
    const colors = {
      transfer_poalim: theme.palette.primary.main,
      credit_rothschild: theme.palette.grey[500],
      bit_poalim: theme.palette.success.main,
      cash: theme.palette.warning.main,
      bit_mizrahi: theme.palette.error.main,
      paybox_poalim: theme.palette.info.main,
      transfer_mizrahi: theme.palette.secondary.main,
      paybox_mizrahi: '#9c27b0',
      credit_or_yehuda: '#795548',
      other: theme.palette.grey[400]
    };
    
    return colors[method] || theme.palette.grey[500];
  };
  
  // שמות אמצעי תשלום בעברית
  const getMethodName = (method) => {
    const names = {
      transfer_poalim: 'העברה פועלים',
      credit_rothschild: 'אשראי רוטשילד',
      bit_poalim: 'ביט פועלים',
      cash: 'מזומן',
      bit_mizrahi: 'ביט מזרחי',
      paybox_poalim: 'פייבוקס פועלים',
      transfer_mizrahi: 'העברה מזרחי',
      paybox_mizrahi: 'פייבוקס מזרחי',
      credit_or_yehuda: 'אשראי אור יהודה',
      other: 'אחר'
    };
    
    return names[method] || method;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {sortedData.map((item, index) => {
        const percentage = Math.round((item.value / total) * 100);
        const color = getMethodColor(item.name);
        
        return (
          <Box 
            key={item.name} 
            sx={{ 
              mb: 1.5, 
              display: 'flex', 
              justifyContent: 'space-between', 
              py: 1,
              borderBottom: index < sortedData.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: color,
                mr: 1.5
              }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {getMethodName(item.name)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  mr: 2.5,
                  color: theme.palette.text.primary 
                }}
              >
                ₪{item.value.toLocaleString()}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  width: 40, 
                  textAlign: 'left',
                  color: theme.palette.text.secondary 
                }}
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

// קומפוננטת תצוגת הוצאות לפי קטגוריה - מודרנית
const ModernExpenseCategoryDisplay = ({ data }) => {
  const theme = useTheme();
  
  // עיבוד וקיבוץ הנתונים לפי קטגוריה
  const processData = () => {
    const categoryMap = {};
    
    // סיכום הוצאות לפי קטגוריה
    data.forEach(expense => {
      const category = expense.category || 'אחר';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          value: 0,
          count: 0
        };
      }
      categoryMap[category].value += expense.amount;
      categoryMap[category].count += 1;
    });
    
    // המרה למערך ומיון לפי סכום (מהגדול לנמוך)
    return Object.values(categoryMap).sort((a, b) => b.value - a.value);
  };
  
  // הנתונים המעובדים
  const processedData = processData();
  
  // חישוב סך הכל
  const total = processedData.reduce((sum, item) => sum + item.value, 0);
  
  // צבעים לפי סוג קטגוריה
  const getCategoryColor = (category) => {
    const colors = {
      'שכירות': theme.palette.error.main,
      'חשמל': theme.palette.warning.main,
      'מים': theme.palette.info.main,
      'ארנונה': theme.palette.primary.main,
      'אינטרנט': theme.palette.secondary.main,
      'ניקיון': '#26c6da',
      'תחזוקה': '#ffc107',
      'ציוד': '#8bc34a',
      'משכורות': '#f06292',
      'פרסום': '#9c27b0',
      'ביטוח': '#795548',
      'אחר': theme.palette.grey[500]
    };
    
    return colors[category] || theme.palette.grey[500];
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {processedData.map((item, index) => {
        const percentage = Math.round((item.value / total) * 100);
        const color = getCategoryColor(item.name);
        
        return (
          <Box 
            key={item.name} 
            sx={{ 
              mb: 1.5, 
              display: 'flex', 
              justifyContent: 'space-between', 
              py: 1,
              borderBottom: index < processedData.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: color,
                mr: 1.5
              }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {item.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  mr: 2.5,
                  color: theme.palette.text.primary 
                }}
              >
                ₪{item.value.toLocaleString()}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  width: 40, 
                  textAlign: 'left',
                  color: theme.palette.text.secondary 
                }}
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>
        );
      })}
      
      {processedData.length === 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%'
        }}>
          <Typography color="text.secondary">
            אין נתוני הוצאות לחודש זה
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * דף סיכום הכנסות והוצאות חודשי
 * מציג נתוני הכנסות, הוצאות וניתוח פיננסי לפי חודש ומתחם
 */
const FinancialOverview = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSite, setSelectedSite] = useState(0); // 0 = רוטשילד, 1 = שדה התעופה
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  
  // מצבים לדיאלוג הוספת הוצאה
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
    paymentMethod: 'cash',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  // שמות המתחמים
  const sites = ['rothschild', 'airport'];
  const siteNames = ['רוטשילד', 'שדה התעופה'];
  
  // קטגוריות הוצאות
  const expenseCategories = [
    'שכירות',
    'חשמל',
    'מים',
    'ארנונה',
    'אינטרנט',
    'ניקיון',
    'תחזוקה',
    'ציוד',
    'משכורות',
    'פרסום',
    'ביטוח',
    'אחר'
  ];
  
  // שיטות תשלום
  const paymentMethods = [
    { value: 'cash', label: 'מזומן' },
    { value: 'credit_or_yehuda', label: 'אשראי אור יהודה' },
    { value: 'credit_rothschild', label: 'אשראי רוטשילד' },
    { value: 'transfer_mizrahi', label: 'העברה מזרחי' },
    { value: 'bit_mizrahi', label: 'ביט מזרחי' },
    { value: 'paybox_mizrahi', label: 'פייבוקס מזרחי' },
    { value: 'transfer_poalim', label: 'העברה פועלים' },
    { value: 'bit_poalim', label: 'ביט פועלים' },
    { value: 'paybox_poalim', label: 'פייבוקס פועלים' },
    { value: 'other', label: 'אחר' }
  ];

  // טוען נתונים בעת שינוי תאריך או מתחם
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const month = getMonth(selectedDate) + 1; // date-fns מחזיר חודשים מ-0 עד 11
        const year = getYear(selectedDate);
        const site = sites[selectedSite];
        
        // קבלת נתוני הכנסות מהשרת
        const data = await getMonthlyRevenueData(site, year, month);
        setRevenueData(data);
        
        // קבלת נתוני הוצאות מהשרת
        const expensesData = await getExpenses(site, year, month);
        setExpenses(expensesData || []);
      } catch (error) {
        console.error('שגיאה בטעינת נתונים פיננסיים:', error);
        // ניתן להוסיף כאן הודעת שגיאה למשתמש
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedSite]);

  // טיפול בשינוי טאב מתחם
  const handleSiteChange = (newValue) => {
    setSelectedSite(newValue);
  };

  // טיפול בשינוי תאריך
  const handleDateChange = (newDate) => {
    setSelectedDate(startOfMonth(newDate || new Date()));
  };
  
  // טיפול בפתיחת דיאלוג הוספת הוצאה
  const handleOpenAddExpense = () => {
    setNewExpense({
      amount: '',
      category: '',
      description: '',
      paymentMethod: 'cash',
      date: format(selectedDate, 'yyyy-MM-dd')
    });
    setOpenAddDialog(true);
  };
  
  // טיפול בשינוי שדות בטופס הוספת הוצאה
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // טיפול בשמירת הוצאה חדשה
  const handleSaveExpense = async () => {
    try {
      const month = getMonth(selectedDate) + 1;
      const year = getYear(selectedDate);
      const site = sites[selectedSite];
      
      // וידוא תקינות הנתונים
      if (!newExpense.amount || !newExpense.category) {
        // כאן אפשר להוסיף התראה למשתמש
        return;
      }
      
      const expenseData = {
        ...newExpense,
        amount: Number(newExpense.amount),
        site,
        year,
        month
      };
      
      // שמירת ההוצאה בשרת
      const result = await addExpense(expenseData);
      
      // עדכון רשימת ההוצאות המקומית
      setExpenses(prev => [...prev, result]);
      
      // סגירת הדיאלוג
      setOpenAddDialog(false);
    } catch (error) {
      console.error('שגיאה בשמירת הוצאה:', error);
      // כאן אפשר להוסיף התראה למשתמש
    }
  };
  
  // טיפול במחיקת הוצאה
  const handleDeleteExpense = async (expenseId) => {
    try {
      // מחיקת ההוצאה בשרת
      await deleteExpense(expenseId);
      
      // עדכון רשימת ההוצאות המקומית
      setExpenses(prev => prev.filter(expense => expense._id !== expenseId));
    } catch (error) {
      console.error('שגיאה במחיקת הוצאה:', error);
      // כאן אפשר להוסיף התראה למשתמש
    }
  };

  // מזהה המיקום הנוכחי (rothschild/airport)
  const currentLocation = sites[selectedSite];
  
  // לוג לבדיקת נתוני הכנסות
  console.log('Revenue data paymentMethods:', revenueData?.paymentMethods);
  
  // חישוב סכום כל ההכנסות מאמצעי התשלום
  let totalRevenueCalc = 0;
  if (revenueData?.paymentMethods) {
    totalRevenueCalc = revenueData.paymentMethods.reduce((sum, method) => {
      console.log('Method:', method, 'Amount:', method.amount || method.value);
      return sum + (method.amount || method.value || 0);
    }, 0);
  }
  console.log('Calculated total revenue:', totalRevenueCalc);
  
  // חישוב סך הכנסות
  const totalRevenue = totalRevenueCalc;
  
  // חישוב סך הוצאות
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // חישוב רווח נקי
  const netProfit = totalRevenue - totalExpenses;

  return (
    <Box 
      sx={{ 
        py: 3, 
        px: 2
      }}
    >
      {/* כותרת ראשית ואזור הניווט */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRadius: '10px',
        p: 1, 
        mb: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* כותרת הדף עם אייקון של כסף */}
        <Avatar 
          sx={{ 
            bgcolor: theme.palette.primary.main, 
            width: 36, 
            height: 36,
            mr: 1
          }}
        >
          <AttachMoneyIcon fontSize="small" />
        </Avatar>
        
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{ 
            fontWeight: 'medium',
            fontSize: '1.1rem'
          }}
        >
          סקירה פיננסית
        </Typography>
        
        {/* מרווח אוטומטי */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* ניווט בין חודשים */}
        <RevenueDateNavigation 
          selectedDate={selectedDate} 
          onDateChange={handleDateChange}
          location={currentLocation}
        />
        
        {/* רווח קטן בין הניווט לטאבים */}
        <Box sx={{ width: 16 }} />
        
        {/* טאבים למתחמים (אייקונים בלבד) */}
        <RevenueTabs 
          selectedSite={selectedSite} 
          onSiteChange={handleSiteChange} 
        />
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        {/* תוכן הדוח */}
        {loading ? (
          <LoadingPanel />
        ) : revenueData ? (
          <Box>
            {/* כרטיסיות סיכום פיננסי */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <InfoCard 
                  title="סה״כ הכנסות"
                  value={`₪${totalRevenue.toLocaleString()}`}
                  type="revenue"
                  icon={<CreditCardIcon />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoCard 
                  title="סה״כ הוצאות"
                  value={`₪${totalExpenses.toLocaleString()}`}
                  type="expense"
                  icon={<ReceiptLongIcon />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <InfoCard 
                  title="רווח נקי"
                  value={`₪${netProfit.toLocaleString()}`}
                  type="profit"
                  icon={<AccountBalanceIcon />}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* פילוח הכנסות לפי אמצעי תשלום - עיצוב מודרני */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    height: '100%', 
                    boxShadow: theme.shadows[1]
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                    הכנסות לפי אמצעי תשלום
                  </Typography>
                  <Box sx={{ height: 220, overflow: 'auto', pr: 1 }}>
                    <ModernPaymentMethodsDisplay data={revenueData.paymentMethods} />
                  </Box>
                </Paper>
              </Grid>

              {/* פילוח הוצאות לפי קטגוריה */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    height: '100%', 
                    boxShadow: theme.shadows[1]
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      הוצאות לפי קטגוריה
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<AddIcon />}
                      onClick={handleOpenAddExpense}
                      sx={{ 
                        borderRadius: 2,
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none', bgcolor: theme.palette.primary.dark }
                      }}
                    >
                      הוספת הוצאה
                    </Button>
                  </Box>
                  
                  <Box sx={{ height: 220, overflow: 'auto', pr: 1 }}>
                    <ModernExpenseCategoryDisplay data={expenses} />
                  </Box>
                </Paper>
              </Grid>

              {/* רשימת הוצאות */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    boxShadow: theme.shadows[1]
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                    פירוט הוצאות
                  </Typography>
                  
                  <ExpensesList 
                    expenses={expenses} 
                    onDelete={handleDeleteExpense}
                    paymentMethods={paymentMethods}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography>לא נמצאו נתונים לחודש זה</Typography>
          </Box>
        )}
      </Paper>
      
      {/* דיאלוג להוספת הוצאה */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          הוספת הוצאה חדשה
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2, pb: 0 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                margin="dense"
                name="amount"
                label="סכום"
                type="number"
                fullWidth
                variant="outlined"
                value={newExpense.amount}
                onChange={handleExpenseChange}
                InputProps={{ 
                  startAdornment: <Box sx={{ mr: 1 }}>₪</Box>
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>קטגוריה</InputLabel>
                <Select
                  name="category"
                  value={newExpense.category}
                  onChange={handleExpenseChange}
                  label="קטגוריה"
                >
                  {expenseCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                name="description"
                label="תיאור"
                type="text"
                fullWidth
                variant="outlined"
                value={newExpense.description}
                onChange={handleExpenseChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>אמצעי תשלום</InputLabel>
                <Select
                  name="paymentMethod"
                  value={newExpense.paymentMethod}
                  onChange={handleExpenseChange}
                  label="אמצעי תשלום"
                >
                  {paymentMethods.map(method => (
                    <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="date"
                label="תאריך"
                type="date"
                fullWidth
                variant="outlined"
                value={newExpense.date}
                onChange={handleExpenseChange}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">
            ביטול
          </Button>
          <Button 
            onClick={handleSaveExpense} 
            variant="contained"
            sx={{ 
              borderRadius: '8px',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinancialOverview; 