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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Divider,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SyncIcon from '@mui/icons-material/Sync';
import { alpha } from '@mui/material/styles';

// שירותים
import { 
  getFullCapitalData, 
  updateInitialAmount, 
  syncFullCapital,
  getPaymentMethodName
} from '../../services/capitalService';
import { useSnackbar } from 'notistack';
import { useFilter } from '../../contexts/FilterContext';

// פאנל לטעינת נתונים
const LoadingPanel = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
    <CircularProgress size={48} thickness={4} sx={{ color: theme => theme.palette.primary.main }} />
  </Box>
);

// קומפוננטת כרטיסייה לסך ההון
const TotalCapitalCard = ({ total }) => {
  const theme = useTheme();

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 2, 
        boxShadow: theme.shadows[2],
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
        textAlign: 'center',
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Avatar 
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)', 
            width: 56, 
            height: 56,
            mb: 2
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />
        </Avatar>
      </Box>
      
      <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
        סך הון העסק
      </Typography>
      
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
        ₪{total?.toLocaleString() || '0'}
      </Typography>
      
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        סכום כולל אחרי הכנסות והוצאות
      </Typography>
    </Paper>
  );
};

// קומפוננטת כרטיסייה לאמצעי תשלום
const PaymentMethodCard = ({ method, name, amount, onEdit }) => {
  const theme = useTheme();
  
  // צבעים לפי סוג אמצעי תשלום
  const getMethodColor = (method) => {
    const colors = {
      transfer_poalim: theme.palette.primary.main,
      credit_rothschild: theme.palette.grey[700],
      bit_poalim: theme.palette.success.main,
      cash: theme.palette.warning.main,
      cash2: theme.palette.warning.dark,
      bit_mizrahi: theme.palette.error.main,
      paybox_poalim: theme.palette.info.main,
      transfer_mizrahi: theme.palette.secondary.main,
      paybox_mizrahi: '#9c27b0',
      credit_or_yehuda: '#795548',
      delayed_transfer: '#ff9800',
      other: theme.palette.grey[500]
    };
    
    return colors[method] || theme.palette.grey[500];
  };

  const color = getMethodColor(method);
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        height: '100%', 
        borderRadius: 2, 
        boxShadow: theme.shadows[1],
        transition: 'all 0.2s ease',
        position: 'relative',
        borderTop: `3px solid ${color}`,
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }
      }}
    >
      <IconButton 
        size="small" 
        sx={{ position: 'absolute', top: 8, left: 8 }}
        onClick={() => onEdit(method, amount)}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      
      <Box sx={{ mb: 2, mt: 1, display: 'flex', alignItems: 'center' }}>
        <Avatar 
          sx={{ 
            bgcolor: alpha(color, 0.2), 
            color: color,
            width: 40, 
            height: 40,
            mr: 1
          }}
        >
          <AttachMoneyIcon />
        </Avatar>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {name}
        </Typography>
      </Box>
      
      <Typography variant="h5" sx={{ textAlign: 'left', fontWeight: 'bold' }}>
        ₪{amount?.toLocaleString() || '0'}
      </Typography>
    </Paper>
  );
};

/**
 * דף ניהול הון
 * מאפשר לראות את כל ההון של העסק מחולק לפי אמצעי תשלום
 * ולעדכן סכומים התחלתיים
 */
const CapitalManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { shouldHidePaymentMethod, isFilterActive } = useFilter();
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [capitalData, setCapitalData] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  
  // מצבים לדיאלוג עדכון סכום התחלתי
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState({
    id: '',
    name: '',
    amount: 0
  });

  // טעינת נתוני הון בעת טעינת הדף או שינוי מצב הסינון
  useEffect(() => {
    fetchCapitalData();
  }, [isFilterActive]);

  // פונקציה לטעינת נתוני הון
  const fetchCapitalData = async () => {
    try {
      setLoading(true);
      const data = await getFullCapitalData();
      setCapitalData(data);
    } catch (error) {
      console.error('שגיאה בטעינת נתוני הון:', error);
      enqueueSnackbar('שגיאה בטעינת נתוני הון', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // פתיחת דיאלוג עדכון סכום
  const handleOpenEditDialog = (methodId, currentAmount) => {
    // מציאת הסכום ההתחלתי מתוך נתוני ההון
    const initialAmount = capitalData?.initialAmounts?.[methodId] || 0;
    
    setCurrentMethod({
      id: methodId,
      name: getPaymentMethodName(methodId),
      amount: initialAmount
    });
    setEditDialogOpen(true);
  };
  
  // שמירת סכום התחלתי חדש
  const handleSaveInitialAmount = async () => {
    try {
      const result = await updateInitialAmount(currentMethod.id, Number(currentMethod.amount));
      
      // עדכון נתוני ההון המקומיים
      setCapitalData(prevData => ({
        ...prevData,
        initialAmounts: result.initialAmounts,
        total: result.total
      }));
      
      enqueueSnackbar('הסכום עודכן בהצלחה', { variant: 'success' });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('שגיאה בעדכון סכום התחלתי:', error);
      enqueueSnackbar('שגיאה בעדכון הסכום', { variant: 'error' });
    }
  };
  
  // עדכון ערך בטופס עריכה
  const handleAmountChange = (e) => {
    setCurrentMethod(prev => ({
      ...prev,
      amount: e.target.value
    }));
  };

  // סנכרון נתוני הון
  const handleSyncCapital = async () => {
    try {
      setSyncLoading(true);
      const result = await syncFullCapital();
      console.log('תוצאות הסנכרון:', result);
      
      // עדכון הממשק עם הנתונים החדשים
      if (result && result.success) {
        // טעינת הנתונים במלואם מחדש במקום רק להחליף
        await fetchCapitalData();
        enqueueSnackbar('סנכרון נתוני הון הושלם בהצלחה', { variant: 'success' });
      } else {
        throw new Error('לא התקבלו נתונים תקינים מהשרת');
      }
    } catch (error) {
      console.error('שגיאה בסנכרון נתוני הון:', error);
      enqueueSnackbar('שגיאה בסנכרון נתוני הון', { variant: 'error' });
    } finally {
      setSyncLoading(false);
    }
  };

  // רשימת אמצעי התשלום והסכומים שלהם
  const getPaymentMethodsData = () => {
    if (!capitalData || !capitalData.paymentMethods) return [];
    
    // סינון אמצעי התשלום - ללא אשראי אור יהודה ואשראי רוטשילד
    // ובהתאם למצב הסינון הגלובלי
    return capitalData.paymentMethods
      .filter(item => {
        // תמיד מסתיר אשראי
        if (item.method === 'credit_or_yehuda' || item.method === 'credit_rothschild') {
          return false;
        }
        
        // אם הסינון פעיל, מסתיר גם את אמצעי התשלום המסוננים
        if (isFilterActive && shouldHidePaymentMethod(item.method)) {
          return false;
        }
        
        return true;
      })
      .map(item => ({
        method: item.method,
        name: getPaymentMethodName(item.method),
        amount: item.totalAmount
      }));
  };

  // חישוב סך ההון ללא אמצעי תשלום מסוימים
  const calculateFilteredTotal = () => {
    if (!capitalData || !capitalData.paymentMethods) return 0;
    
    return capitalData.paymentMethods.reduce((sum, item) => {
      // לא כולל אשראי אור יהודה ואשראי רוטשילד
      if (item.method === 'credit_or_yehuda' || item.method === 'credit_rothschild') {
        return sum;
      }
      
      // אם הסינון פעיל, לא כולל גם את אמצעי התשלום המסוננים
      if (isFilterActive && shouldHidePaymentMethod(item.method)) {
        return sum;
      }
      
      return sum + item.totalAmount;
    }, 0);
  };

  return (
    <Box sx={{ py: 3, px: 2 }}>
      {/* כותרת הדף */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          ניהול הון
        </Typography>
        
        <Tooltip title="סנכרון נתוני הון">
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleSyncCapital}
            disabled={syncLoading}
          >
            {syncLoading ? 'מסנכרן...' : 'סנכרון נתונים'}
          </Button>
        </Tooltip>
      </Box>
      
      {/* תוכן הדף */}
      {loading ? (
        <LoadingPanel />
      ) : capitalData ? (
        <Box>
          {/* כרטיסיית סך הון */}
          <TotalCapitalCard total={calculateFilteredTotal()} />
          
          {/* רשימת אמצעי תשלום */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            חלוקה לפי אמצעי תשלום
          </Typography>
          
          <Grid container spacing={2}>
            {getPaymentMethodsData().map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.method}>
                <PaymentMethodCard
                  method={item.method}
                  name={item.name}
                  amount={item.amount}
                  onEdit={handleOpenEditDialog}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* מידע נוסף */}
          <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              * הסכומים המוצגים מחושבים משילוב של סכום התחלתי שהוזן ידנית עם הכנסות והוצאות מכל המתחמים.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              * עדכון ידני של סכום יעדכן את הסכום ההתחלתי בלבד ולא ישנה את נתוני ההכנסות וההוצאות.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              עדכון אחרון: {capitalData.lastUpdated ? new Date(capitalData.lastUpdated).toLocaleString('he-IL') : 'לא ידוע'}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography>לא נמצאו נתוני הון</Typography>
      )}
      
      {/* דיאלוג עדכון סכום */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          עדכון סכום: {currentMethod.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="סכום"
            type="number"
            fullWidth
            value={currentMethod.amount}
            onChange={handleAmountChange}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₪</Typography>,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            הערה: עדכון זה ישנה את הסכום ההתחלתי של אמצעי התשלום,
            ולא ישפיע על נתוני ההכנסות וההוצאות.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>ביטול</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveInitialAmount}
          >
            שמירה
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CapitalManagement; 