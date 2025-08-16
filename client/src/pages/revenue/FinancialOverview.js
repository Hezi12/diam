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
  LinearProgress,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Switch
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
import RefreshIcon from '@mui/icons-material/Refresh';
import MoneyIcon from '@mui/icons-material/Money';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { getPaymentMethodName } from '../../constants/paymentMethods';

// קומפוננטות לתצוגת הדוח
import RevenueDateNavigation from '../../components/revenue/RevenueDateNavigation';
import RevenueTabs from '../../components/revenue/RevenueTabs';
import PaymentMethodChart from '../../components/revenue/PaymentMethodChart';
import { useFilter } from '../../contexts/FilterContext';
import RevenueSummaryCards from '../../components/revenue/RevenueSummaryCards';
import ExpensesList from '../../components/revenue/ExpensesList';
import ExpenseCategoryChart from '../../components/revenue/ExpenseCategoryChart';
import ManualIncomesList from '../../components/revenue/ManualIncomesList';
import ImportExpensesModal from '../../components/revenue/ImportExpensesModal';

// סרוויס לקבלת נתונים
import { getMonthlyRevenueData } from '../../services/revenueService';
import { getExpenses, addExpense, deleteExpense, updateExpense, addBatchExpenses } from '../../services/expenseService';
import { getManualIncomes, addManualIncome, deleteManualIncome, getIncomeCategories } from '../../services/incomeService';

// פאנל לטעינת נתונים
const LoadingPanel = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
    <CircularProgress size={48} thickness={4} sx={{ color: theme => theme.palette.primary.main }} />
  </Box>
);

// קומפוננטת כרטיסייה מידע
const InfoCard = ({ title, value, type = 'default', icon, details }) => {
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
    withdrawal: {
      color: theme.palette.warning.main,
      iconColor: 'warning'
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

      {details && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
          {details.map((detail, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {detail.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {detail.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
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
  const { shouldHidePaymentMethod, isFilterActive } = useFilter();
  
  // סינון נתונים - ללא אשראי אור יהודה ואשראי רוטשילד
  // ובהתאם למצב הסינון הגלובלי
  const filteredData = data.filter(item => {
    // תמיד מסתיר אשראי
    if (item.name === 'credit_or_yehuda' || item.name === 'credit_rothschild') {
      return false;
    }
    
    // אם הסינון פעיל, מסתיר גם את אמצעי התשלום המסוננים
    if (isFilterActive && shouldHidePaymentMethod(item.name)) {
      return false;
    }
    
    return true;
  });
  
  // מיון הנתונים לפי גודל - מהגדול לקטן
  const sortedData = [...filteredData].sort((a, b) => b.value - a.value);
  
  // חישוב סך הכל (רק על הנתונים המסוננים)
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);
  
  // צבעים לפי סוג אמצעי תשלום
  const getMethodColor = (method) => {
    const colors = {
      transfer_poalim: theme.palette.primary.main,
      credit_rothschild: theme.palette.grey[500],
      bit_poalim: theme.palette.success.main,
      cash: theme.palette.warning.main,
      cash2: theme.palette.warning.dark,
      bit_mizrahi: theme.palette.error.main,
      paybox_poalim: theme.palette.info.main,
      transfer_mizrahi: theme.palette.secondary.main,
      paybox_mizrahi: '#9c27b0',
      credit_or_yehuda: '#795548',
      other: theme.palette.grey[400]
    };
    
    return colors[method] || theme.palette.grey[500];
  };
  
  // שמות אמצעי תשלום בעברית - שימוש בפונקציה המרכזית
  const getMethodName = getPaymentMethodName;

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
      'משיכה': '#ff5722',
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
  const { filterBookings, isFilterActive } = useFilter();
  
  // שמות המתחמים - העברתי לכאן מלמעלה
  const sites = ['rothschild', 'airport'];
  const siteNames = ['רוטשילד', 'שדה התעופה'];
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSite, setSelectedSite] = useState(0); // 0 = רוטשילד, 1 = שדה התעופה
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [manualIncomes, setManualIncomes] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = הוצאות, 1 = הכנסות ידניות
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  // מצבים לדיאלוג הוספת הוצאה
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
    paymentMethod: 'cash',
    date: format(new Date(), 'yyyy-MM-dd'),
    location: sites[selectedSite],
    splitBetweenLocations: false
  });

  // מצבים לדיאלוג הוספת הכנסה ידנית
  const [openAddIncomeDialog, setOpenAddIncomeDialog] = useState(false);
  const [newIncome, setNewIncome] = useState({
    amount: '',
    category: '',
    description: '',
    paymentMethod: 'cash',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  // מצבים לדיאלוג עריכת הוצאה
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // מצבים לדיאלוג ייבוא הוצאות מאקסל
  const [openImportDialog, setOpenImportDialog] = useState(false);
  
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
    'משיכה',
    'תקשורת',
    'ריהוט',
    'אחזקת-אתר',
    'עמלות-בנק',
    'מס הכנסה ניכויים',
    'מס הכנסה',
    'אחר'
  ];
  
  // שיטות תשלום - מסוננות לפי מצב הסינון
  const allPaymentMethods = [
    { value: 'cash', label: 'מזומן' },
    { value: 'cash2', label: 'מזומן2' },
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

  const { filterPaymentMethods } = useFilter();
  const paymentMethods = filterPaymentMethods(allPaymentMethods);

  // קטגוריות הכנסה
  const defaultIncomeCategories = [
    { _id: null, name: 'הזמנות' },
    { _id: null, name: 'דמי ביטול' },
    { _id: null, name: 'מכירות נוספות' },
    { _id: null, name: 'החזרים' },
    { _id: null, name: 'אחר' }
  ];

  // פונקציה לטעינת נתונים
  const fetchData = async () => {
    setLoading(true);
    try {
      const month = getMonth(selectedDate) + 1; // date-fns מחזיר חודשים מ-0 עד 11
      const year = getYear(selectedDate);
      const site = sites[selectedSite];
      
      console.log(`טוען נתונים עבור מתחם ${site}, חודש ${month}, שנה ${year}`);
      
      // קבלת נתוני הכנסות מהשרת
      const data = await getMonthlyRevenueData(site, year, month);
      setRevenueData(data);
      
      // קבלת נתוני הוצאות מהשרת
      const expensesData = await getExpenses(site, year, month);
      console.log('הוצאות שהתקבלו מהשרת:', expensesData);
      setExpenses(expensesData || []);
      
      // קבלת נתוני הכנסות ידניות מהשרת
      const manualIncomesData = await getManualIncomes(site, year, month);
      console.log('הכנסות ידניות שהתקבלו מהשרת:', manualIncomesData);
      setManualIncomes(manualIncomesData || []);
      
      // קבלת קטגוריות הכנסה
      try {
        const categories = await getIncomeCategories();
        if (categories && categories.length > 0) {
          setIncomeCategories(categories);
        }
      } catch (error) {
        console.error('שגיאה בטעינת קטגוריות הכנסה, משתמש בברירות מחדל:', error);
        // אם יש שגיאה בטעינת הקטגוריות, נשתמש בברירות מחדל
      }
      
    } catch (error) {
      console.error('שגיאה בטעינת נתונים פיננסיים:', error);
      // ניתן להוסיף כאן הודעת שגיאה למשתמש
    } finally {
      setLoading(false);
    }
  };

  // טוען נתונים בעת שינוי תאריך, מתחם או מצב סינון
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedSite, isFilterActive]);

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
      date: format(selectedDate, 'yyyy-MM-dd'),
      location: sites[selectedSite],
      splitBetweenLocations: false
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
      
      console.log('שולח נתוני הוצאה חדשה:', expenseData);
      
      // שמירת ההוצאה בשרת
      const result = await addExpense(expenseData);
      
      console.log('תוצאה מהשרת לאחר הוספת הוצאה:', result);
      
      // עדכון רשימת ההוצאות המקומית
      setExpenses(prev => {
        // אם התוצאה היא מערך (הוצאה מחולקת), נוסיף את כל ההוצאות
        const newExpenses = Array.isArray(result) ? [...prev, ...result] : [...prev, result];
        console.log('רשימת ההוצאות המעודכנת:', newExpenses);
        return newExpenses;
      });
      
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

  // טיפול בשינוי טאב בין הוצאות להכנסות ידניות
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // טיפול בפתיחת דיאלוג הוספת הכנסה ידנית
  const handleOpenAddIncome = () => {
    setNewIncome({
      amount: '',
      category: '',
      description: '',
      paymentMethod: 'cash',
      date: format(selectedDate, 'yyyy-MM-dd')
    });
    setOpenAddIncomeDialog(true);
  };
  
  // טיפול בשינוי שדות בטופס הוספת הכנסה ידנית
  const handleIncomeChange = (e) => {
    const { name, value } = e.target;
    setNewIncome(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // טיפול בשמירת הכנסה ידנית חדשה
  const handleSaveIncome = async () => {
    try {
      const month = getMonth(selectedDate) + 1;
      const year = getYear(selectedDate);
      const site = sites[selectedSite];
      
      // וידוא תקינות הנתונים
      if (!newIncome.amount || !newIncome.description) {
        setErrorMessage("יש למלא סכום ותיאור");
        setShowError(true);
        return;
      }
      
      const incomeData = {
        ...newIncome,
        amount: Number(newIncome.amount),
        site,
        year,
        month
      };
      
      console.log('שולח נתוני הכנסה ידנית חדשה:', incomeData);
      
      // שמירת ההכנסה בשרת
      const result = await addManualIncome(incomeData);
      
      console.log('תוצאה מהשרת לאחר הוספת הכנסה ידנית:', result);
      
      // עדכון רשימת ההכנסות המקומית
      setManualIncomes(prev => {
        const newIncomes = [...prev, result];
        console.log('רשימת ההכנסות הידניות המעודכנת:', newIncomes);
        return newIncomes;
      });
      
      // סגירת הדיאלוג
      setOpenAddIncomeDialog(false);
    } catch (error) {
      console.error('שגיאה בשמירת הכנסה ידנית:', error);
      setErrorMessage("שגיאה בשמירת ההכנסה: " + (error.response?.data?.message || error.message || "שגיאת שרת"));
      setShowError(true);
    }
  };
  
  // טיפול במחיקת הכנסה ידנית
  const handleDeleteIncome = async (incomeId) => {
    try {
      // מחיקת ההכנסה בשרת
      await deleteManualIncome(incomeId);
      
      // עדכון רשימת ההכנסות המקומית
      setManualIncomes(prev => prev.filter(income => income._id !== incomeId));
    } catch (error) {
      console.error('שגיאה במחיקת הכנסה ידנית:', error);
      // כאן אפשר להוסיף התראה למשתמש
    }
  };

  // מזהה המיקום הנוכחי (rothschild/airport)
  const currentLocation = sites[selectedSite];
  
  // לוג לבדיקת נתוני הכנסות
  console.log('Revenue data paymentMethods:', revenueData?.paymentMethods);
  
  // חישוב סך הכנסות
  let totalRevenueCalc = 0;
  
  if (revenueData?.paymentMethods) {
    totalRevenueCalc = revenueData.paymentMethods.reduce((sum, method) => {
      console.log('Method:', method, 'Amount:', method.amount || method.value);
      // לא כולל הכנסות מאשראי אור יהודה ואשראי רוטשילד
      if (method.name === 'credit_or_yehuda' || method.name === 'credit_rothschild') {
        return sum;
      }
      return sum + (method.amount || method.value || 0);
    }, 0);
  }
  console.log('Calculated total revenue:', totalRevenueCalc);
  
  // חישוב סך הכנסות מהזמנות
  const totalBookingRevenue = totalRevenueCalc;
  
  // חישוב סך הכנסות ידניות
  const totalManualIncome = manualIncomes.reduce((sum, income) => {
    // לא כולל הכנסות מאשראי אור יהודה ואשראי רוטשילד
    if (income.paymentMethod === 'credit_or_yehuda' || income.paymentMethod === 'credit_rothschild') {
      return sum;
    }
    return sum + income.amount;
  }, 0);
  
  // חישוב סך כל ההכנסות
  const totalRevenue = totalBookingRevenue + totalManualIncome;
  
  // חישוב סך הוצאות
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // חישוב סך הוצאות מקטגוריית משיכה
  // הוספת הערת תיעוד: קטגוריית משיכה מתייחסת להוצאות כספים פרטיות
  const totalWithdrawals = expenses
    .filter(expense => expense.category === 'משיכה')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // חישוב רווח נקי
  const netProfit = totalRevenue - totalExpenses;
  
  // חישוב רווח נקי + משיכות
  const netProfitWithWithdrawals = netProfit + totalWithdrawals;

  // טיפול בפתיחת דיאלוג עריכת הוצאה
  const handleOpenEditExpense = (expense) => {
    setEditingExpense({
      ...expense,
      date: format(new Date(expense.date), 'yyyy-MM-dd')
    });
    setOpenEditDialog(true);
  };

  // טיפול בשינוי שדות בטופס עריכת הוצאה
  const handleEditExpenseChange = (e) => {
    const { name, value } = e.target;
    setEditingExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // טיפול בשמירת הוצאה שעודכנה
  const handleSaveEditedExpense = async () => {
    try {
      if (!editingExpense.amount || !editingExpense.category) {
        return;
      }

      const result = await updateExpense(editingExpense._id, editingExpense);
      
      // עדכון רשימת ההוצאות המקומית
      setExpenses(prev => prev.map(expense => 
        expense._id === editingExpense._id ? result : expense
      ));
      
      // סגירת הדיאלוג
      setOpenEditDialog(false);
    } catch (error) {
      console.error('שגיאה בעדכון הוצאה:', error);
    }
  };
  
  // פתיחת דיאלוג ייבוא הוצאות
  const handleOpenImportDialog = () => {
    setOpenImportDialog(true);
  };
  
  // שמירת הוצאות מייבוא אקסל
  const handleSaveImportedExpenses = async (importedExpenses) => {
    try {
      const month = getMonth(selectedDate) + 1;
      const year = getYear(selectedDate);
      const site = sites[selectedSite];
      
      setLoading(true);
      
      // הכנת הוצאות לשמירה בפורמט המוכר לשרת
      const expensesToSave = importedExpenses.map(expense => ({
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        category: expense.category,
        location: site,
        paymentMethod: expense.paymentMethod,
        isRecurring: false
      }));
      
      // שימוש בשירות החדש לשמירת הוצאות באצ'
      const savedExpenses = await addBatchExpenses(expensesToSave);
      
      // עדכון רשימת ההוצאות המקומית
      setExpenses(prev => [...prev, ...savedExpenses]);
      
      // סגירת הדיאלוג
      setOpenImportDialog(false);
      
      // רענון הנתונים
      fetchData();
      
      // הצגת הודעת הצלחה
      setErrorMessage(`נוספו ${savedExpenses.length} הוצאות בהצלחה`);
      setShowError(true);
    } catch (error) {
      console.error('שגיאה בשמירת הוצאות מייבוא:', error);
      setErrorMessage("שגיאה בשמירת ההוצאות: " + (error.response?.data?.message || error.message || "שגיאת שרת"));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* כפתור רענון נתונים */}
        <Tooltip title="רענון נתונים">
          <IconButton 
            color="primary" 
            onClick={fetchData}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        
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
              <Grid item xs={12} md={3}>
                <InfoCard 
                  title="סה״כ הכנסות"
                  value={`₪${totalRevenue.toLocaleString()}`}
                  type="revenue"
                  icon={<CreditCardIcon />}
                  details={[
                    { 
                      label: "הכנסות מהזמנות",
                      value: `₪${totalBookingRevenue.toLocaleString()}`
                    },
                    { 
                      label: "הכנסות ידניות",
                      value: `₪${totalManualIncome.toLocaleString()}`
                    }
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoCard 
                  title="סה״כ הוצאות"
                  value={`₪${totalExpenses.toLocaleString()}`}
                  type="expense"
                  icon={<ReceiptLongIcon />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoCard 
                  title="רווח נקי"
                  value={`₪${netProfit.toLocaleString()}`}
                  type="profit"
                  icon={<AccountBalanceIcon />}
                  details={[
                    { 
                      label: "רווח נקי + משיכות",
                      value: `₪${netProfitWithWithdrawals.toLocaleString()}`
                    }
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <InfoCard 
                  title="סה״כ משיכות"
                  value={`₪${totalWithdrawals.toLocaleString()}`}
                  type="withdrawal"
                  icon={<AccountBalanceWalletIcon />}
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

              {/* טאבים להחלפה בין הוצאות והכנסות ידניות */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    boxShadow: theme.shadows[1]
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Tabs 
                      value={selectedTab} 
                      onChange={handleTabChange}
                      sx={{ 
                        minHeight: '40px',
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTabs-indicator': {
                          height: 3,
                          borderTopLeftRadius: 3,
                          borderTopRightRadius: 3
                        }
                      }}
                    >
                      <Tab label="הוצאות" sx={{ minHeight: '40px' }} />
                      <Tab label="הכנסות ידניות" sx={{ minHeight: '40px' }} />
                    </Tabs>
                    
                    {/* כפתור הוספה דינמי בהתאם לטאב הנבחר */}
                    {selectedTab === 0 ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<FileUploadIcon />}
                          onClick={handleOpenImportDialog}
                          sx={{ 
                            borderRadius: 2,
                            boxShadow: 'none'
                          }}
                        >
                          ייבוא מאקסל
                        </Button>
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
                    ) : (
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddIncome}
                        color="success"
                        sx={{ 
                          borderRadius: 2,
                          boxShadow: 'none',
                          '&:hover': { boxShadow: 'none' }
                        }}
                      >
                        הוספת הכנסה ידנית
                      </Button>
                    )}
                  </Box>
                  
                  {/* תצוגת רשימה דינמית בהתאם לטאב */}
                  {selectedTab === 0 ? (
                    <ExpensesList 
                      expenses={expenses} 
                      onDelete={handleDeleteExpense}
                      onEdit={handleOpenEditExpense}
                      paymentMethods={paymentMethods}
                    />
                  ) : (
                    <ManualIncomesList 
                      manualIncomes={manualIncomes} 
                      onDelete={handleDeleteIncome}
                      paymentMethods={paymentMethods}
                    />
                  )}
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
              <FormControl fullWidth margin="dense">
                <InputLabel>מתחם אירוח</InputLabel>
                <Select
                  name="location"
                  value={newExpense.location}
                  onChange={handleExpenseChange}
                  label="מתחם אירוח"
                  disabled={newExpense.splitBetweenLocations}
                >
                  {sites.map((site, index) => (
                    <MenuItem key={site} value={site}>{siteNames[index]}</MenuItem>
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
            <Grid item xs={12}>
              <FormControl fullWidth margin="dense">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    חלוקת ההוצאה בין שני המתחמים
                  </Typography>
                  <Switch
                    checked={newExpense.splitBetweenLocations}
                    onChange={(e) => {
                      setNewExpense(prev => ({
                        ...prev,
                        splitBetweenLocations: e.target.checked,
                        location: e.target.checked ? 'both' : sites[selectedSite]
                      }));
                    }}
                    color="primary"
                  />
                </Box>
                {newExpense.splitBetweenLocations && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    הסכום יחולק שווה בשווה בין שני המתחמים (₪{newExpense.amount ? (Number(newExpense.amount) / 2).toFixed(2) : '0'} לכל מתחם)
                  </Typography>
                )}
              </FormControl>
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
      
      {/* דיאלוג להוספת הכנסה ידנית */}
      <Dialog 
        open={openAddIncomeDialog} 
        onClose={() => setOpenAddIncomeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          הוספת הכנסה ידנית חדשה
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
                value={newIncome.amount}
                onChange={handleIncomeChange}
                InputProps={{ 
                  startAdornment: <Box sx={{ mr: 1 }}>₪</Box>,
                  style: { color: theme.palette.success.main }
                }}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>קטגוריה</InputLabel>
                <Select
                  name="category"
                  value={newIncome.category}
                  onChange={handleIncomeChange}
                  label="קטגוריה"
                >
                  {(incomeCategories.length > 0 ? incomeCategories : defaultIncomeCategories).map(category => (
                    <MenuItem key={category._id || category.name} 
                              value={category._id || ''}>
                      {category.name}
                    </MenuItem>
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
                value={newIncome.description}
                onChange={handleIncomeChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>אמצעי תשלום</InputLabel>
                <Select
                  name="paymentMethod"
                  value={newIncome.paymentMethod}
                  onChange={handleIncomeChange}
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
                value={newIncome.date}
                onChange={handleIncomeChange}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenAddIncomeDialog(false)} color="inherit">
            ביטול
          </Button>
          <Button 
            onClick={handleSaveIncome} 
            variant="contained"
            color="success"
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
      
      {/* דיאלוג לעריכת הוצאה */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          עריכת הוצאה
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
                value={editingExpense?.amount || ''}
                onChange={handleEditExpenseChange}
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
                  value={editingExpense?.category || ''}
                  onChange={handleEditExpenseChange}
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
                value={editingExpense?.description || ''}
                onChange={handleEditExpenseChange}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>אמצעי תשלום</InputLabel>
                <Select
                  name="paymentMethod"
                  value={editingExpense?.paymentMethod || ''}
                  onChange={handleEditExpenseChange}
                  label="אמצעי תשלום"
                >
                  {paymentMethods.map(method => (
                    <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>מתחם אירוח</InputLabel>
                <Select
                  name="location"
                  value={editingExpense?.location || ''}
                  onChange={handleEditExpenseChange}
                  label="מתחם אירוח"
                >
                  {sites.map((site, index) => (
                    <MenuItem key={site} value={site}>{siteNames[index]}</MenuItem>
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
                value={editingExpense?.date || ''}
                onChange={handleEditExpenseChange}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenEditDialog(false)} color="inherit">
            ביטול
          </Button>
          <Button 
            onClick={handleSaveEditedExpense} 
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
      
      {/* מודל ייבוא הוצאות מאקסל */}
      <ImportExpensesModal 
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onSave={handleSaveImportedExpenses}
        expenseCategories={expenseCategories}
        paymentMethods={paymentMethods}
        currentLocation={sites[selectedSite]}
      />
      
      {/* הודעת שגיאה */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FinancialOverview; 