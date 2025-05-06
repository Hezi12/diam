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
  useMediaQuery
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

// שירותי נתונים
import { getCapitalData, updateInitialAmount } from '../../services/capitalService';

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
      bit_mizrahi: theme.palette.error.main,
      paybox_poalim: theme.palette.info.main,
      transfer_mizrahi: theme.palette.secondary.main,
      paybox_mizrahi: '#9c27b0',
      credit_or_yehuda: '#795548',
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
            bgcolor: alpha => `${color}20`, 
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
  const [loading, setLoading] = useState(true);
  const [capitalData, setCapitalData] = useState(null);
  
  // מצבים לדיאלוג עדכון סכום התחלתי
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState({
    id: '',
    name: '',
    amount: 0
  });

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

  // טעינת נתוני הון בעת טעינת הדף
  useEffect(() => {
    const fetchCapitalData = async () => {
      setLoading(true);
      try {
        const data = await getCapitalData();
        setCapitalData(data);
      } catch (error) {
        console.error('שגיאה בטעינת נתוני הון:', error);
        // כאן ניתן להוסיף חיווי שגיאה למשתמש
      } finally {
        setLoading(false);
      }
    };

    fetchCapitalData();
  }, []);

  // פתיחת דיאלוג עדכון סכום
  const handleOpenEditDialog = (methodId, currentAmount) => {
    setCurrentMethod({
      id: methodId,
      name: getMethodName(methodId),
      amount: currentAmount || 0
    });
    setEditDialogOpen(true);
  };
  
  // שמירת סכום התחלתי חדש
  const handleSaveInitialAmount = async () => {
    try {
      await updateInitialAmount(currentMethod.id, Number(currentMethod.amount));
      
      // עדכון נתוני ההון המקומיים
      setCapitalData(prevData => ({
        ...prevData,
        initialAmounts: {
          ...prevData.initialAmounts,
          [currentMethod.id]: Number(currentMethod.amount)
        }
      }));
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error('שגיאה בעדכון סכום התחלתי:', error);
      // כאן ניתן להוסיף חיווי שגיאה למשתמש
    }
  };
  
  // עדכון ערך בטופס עריכה
  const handleAmountChange = (e) => {
    setCurrentMethod(prev => ({
      ...prev,
      amount: e.target.value
    }));
  };

  // רשימת אמצעי התשלום והסכומים שלהם
  const getPaymentMethodsData = () => {
    if (!capitalData || !capitalData.paymentMethods) return [];
    
    // המרה לפורמט לתצוגה
    return Object.entries(capitalData.paymentMethods).map(([method, amount]) => ({
      id: method,
      name: getMethodName(method),
      amount
    }));
  };

  return (
    <Box 
      sx={{ 
        py: 3, 
        px: 2
      }}
    >
      {/* כותרת ראשית */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRadius: '10px',
        p: 1, 
        mb: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <Avatar 
          sx={{ 
            bgcolor: theme.palette.primary.main, 
            width: 36, 
            height: 36,
            mr: 1
          }}
        >
          <AccountBalanceWalletIcon fontSize="small" />
        </Avatar>
        
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{ 
            fontWeight: 'medium',
            fontSize: '1.1rem'
          }}
        >
          ניהול הון
        </Typography>
      </Box>

      {/* תוכן הדף */}
      {loading ? (
        <LoadingPanel />
      ) : capitalData ? (
        <Box>
          {/* כרטיסייה לסך ההון */}
          <TotalCapitalCard total={capitalData.total} />
          
          {/* רשימת אמצעי תשלום */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
            חלוקה לפי אמצעי תשלום
          </Typography>
          
          <Grid container spacing={2}>
            {getPaymentMethodsData().map(method => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={method.id}>
                <PaymentMethodCard 
                  method={method.id}
                  name={method.name}
                  amount={method.amount}
                  onEdit={handleOpenEditDialog}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography>לא נמצאו נתוני הון</Typography>
        </Box>
      )}
      
      {/* דיאלוג עדכון סכום התחלתי */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          עדכון יתרה: {currentMethod.name}
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="סכום"
            type="number"
            fullWidth
            variant="outlined"
            value={currentMethod.amount}
            onChange={handleAmountChange}
            InputProps={{ 
              startAdornment: <Box sx={{ mr: 1 }}>₪</Box>
            }}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            הערה: עדכון זה משנה את היתרה הבסיסית של אמצעי התשלום.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            ביטול
          </Button>
          <Button 
            onClick={handleSaveInitialAmount} 
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

export default CapitalManagement; 