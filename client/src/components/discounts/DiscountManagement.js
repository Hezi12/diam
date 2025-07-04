import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fab,
  Collapse,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { he } from 'date-fns/locale';
import DiscountForm from './DiscountForm';
import DiscountStats from './DiscountStats';

/**
 * ממשק ניהול הנחות
 */
const DiscountManagement = ({ location = 'both' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State ניהול נתונים
  const [discounts, setDiscounts] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State דיאלוגים
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  
  // State נתונים נוכחיים
  const [currentDiscount, setCurrentDiscount] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  
  // State פילטרים
  const [filters, setFilters] = useState({
    location: location !== 'both' ? location : '',
    isActive: '',
    validityType: '',
    searchText: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // State סטטיסטיקות
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // טעינת הנחות
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (location !== 'both') params.append('location', location);
      
      const response = await axios.get(`/api/discounts?${params.toString()}`);
      setDiscounts(response.data);
      
    } catch (err) {
      console.error('שגיאה בטעינת הנחות:', err);
      setError('שגיאה בטעינת רשימת ההנחות');
    } finally {
      setLoading(false);
    }
  };

  // טעינת סטטיסטיקות
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      
      const params = new URLSearchParams();
      if (location !== 'both') params.append('location', location);
      
      const response = await axios.get(`/api/discounts/stats/overview?${params.toString()}`);
      setStats(response.data);
      
    } catch (err) {
      console.error('שגיאה בטעינת סטטיסטיקות:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // אפקט טעינה ראשונית
  useEffect(() => {
    fetchDiscounts();
    fetchStats();
  }, [location]);

  // אפקט פילטור
  useEffect(() => {
    let filtered = [...discounts];
    
    // פילטור לפי מיקום
    if (filters.location) {
      filtered = filtered.filter(discount => 
        discount.location === filters.location || discount.location === 'both'
      );
    }
    
    // פילטור לפי סטטוס פעילות
    if (filters.isActive !== '') {
      filtered = filtered.filter(discount => 
        discount.isActive === (filters.isActive === 'true')
      );
    }
    
    // פילטור לפי סוג תוקף
    if (filters.validityType) {
      filtered = filtered.filter(discount => 
        discount.validityType === filters.validityType
      );
    }
    
    // פילטור לפי טקסט חיפוש
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(discount => 
        discount.name.toLowerCase().includes(searchLower) ||
        discount.description.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredDiscounts(filtered);
  }, [discounts, filters]);

  // פונקציות ניהול הנחות
  const handleAdd = () => {
    setCurrentDiscount(null);
    setIsEdit(false);
    setFormOpen(true);
  };

  const handleEdit = (discount) => {
    setCurrentDiscount(discount);
    setIsEdit(true);
    setFormOpen(true);
  };

  const handleView = (discount) => {
    setCurrentDiscount(discount);
    setViewOpen(true);
  };

  const handleDeleteClick = (discount) => {
    setCurrentDiscount(discount);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/discounts/${currentDiscount._id}`);
      setSuccess('הנחה נמחקה בהצלחה');
      setDeleteOpen(false);
      setCurrentDiscount(null);
      fetchDiscounts();
    } catch (err) {
      console.error('שגיאה במחיקת הנחה:', err);
      setError('שגיאה במחיקת ההנחה');
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      await axios.patch(`/api/discounts/${discount._id}`, {
        isActive: !discount.isActive
      });
      fetchDiscounts();
    } catch (err) {
      console.error('שגיאה בעדכון סטטוס:', err);
      setError('שגיאה בעדכון סטטוס ההנחה');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (isEdit) {
        await axios.patch(`/api/discounts/${currentDiscount._id}`, formData);
        setSuccess('הנחה עודכנה בהצלחה');
      } else {
        await axios.post('/api/discounts', formData);
        setSuccess('הנחה נוצרה בהצלחה');
      }
      
      setFormOpen(false);
      setCurrentDiscount(null);
      fetchDiscounts();
      fetchStats();
      
    } catch (err) {
      console.error('שגיאה בשמירת הנחה:', err);
      setError('שגיאה בשמירת ההנחה');
    }
  };

  const getValidityStatus = (discount) => {
    if (!discount.isActive) {
      return { text: 'לא פעיל', color: 'default' };
    }

    const now = new Date();

    switch (discount.validityType) {
      case 'unlimited':
        return { text: 'פעיל', color: 'success' };
      
      case 'date_range':
        const validFrom = new Date(discount.validFrom);
        const validUntil = new Date(discount.validUntil);
        
        if (now < validFrom) {
          return { text: 'עתידי', color: 'warning' };
        } else if (now > validUntil) {
          return { text: 'פג תוקף', color: 'error' };
        } else {
          return { text: 'פעיל', color: 'success' };
        }
      
      case 'last_minute':
        return { text: 'רגע אחרון', color: 'info' };
      
      default:
        return { text: 'לא ידוע', color: 'default' };
    }
  };

  const getDiscountTypeText = (type, value) => {
    return type === 'percentage' ? `${value}%` : `₪${value}`;
  };

  const getLocationText = (loc) => {
    const locations = { airport: 'שדה התעופה', rothschild: 'רוטשילד', both: 'שניהם' };
    return locations[loc] || loc;
  };

  const handleCopyDiscount = async (discount) => {
    try {
      const discountCopy = {
        ...discount,
        name: `${discount.name} - עותק`,
        isActive: true
      };
      
      // הסרת שדות שלא צריכים להיות בעותק
      delete discountCopy._id;
      delete discountCopy.createdAt;
      delete discountCopy.updatedAt;
      delete discountCopy.usageHistory;
      delete discountCopy.usageLimit.currentUses;
      
      await axios.post('/api/discounts', discountCopy);
      setSuccess('הנחה הועתקה בהצלחה');
      fetchDiscounts();
      
    } catch (err) {
      console.error('שגיאה בהעתקת הנחה:', err);
      setError('שגיאה בהעתקת ההנחה');
    }
  };

  const renderDiscountCard = (discount) => {
    const validityStatus = getValidityStatus(discount);
    
    return (
      <Card key={discount._id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="h3">
              {discount.name}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleEdit(discount)}
              >
                עריכה
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleDeleteClick(discount)}
                color="error"
              >
                מחיקה
              </Button>
            </Box>
          </Box>
          
          {discount.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {discount.description}
            </Typography>
          )}
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={getDiscountTypeText(discount.discountType, discount.discountValue)}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={getLocationText(discount.location)}
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={validityStatus.text}
                color={validityStatus.color}
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Chip
                label={`עדיפות: ${discount.priority}`}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
          
          {discount.usageLimit.maxUses && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                שימוש: {discount.usageLimit.currentUses} / {discount.usageLimit.maxUses}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(discount.usageLimit.currentUses / discount.usageLimit.maxUses) * 100}
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={discount.isActive}
                  onChange={() => handleToggleStatus(discount)}
                  color="primary"
                />
              }
              label="פעיל"
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleCopyDiscount(discount)}
              >
                שכפול
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleView(discount)}
              >
                צפייה
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          ניהול הנחות
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setStatsOpen(true)}
          >
            סטטיסטיקות
          </Button>
          <Button
            variant="contained"
            onClick={handleAdd}
          >
            הנחה חדשה
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* רשימת הנחות */}
      <Box sx={{ mt: 2 }}>
        {filteredDiscounts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              לא נמצאו הנחות
            </Typography>
          </Paper>
        ) : (
          filteredDiscounts.map(discount => renderDiscountCard(discount))
        )}
      </Box>

      {/* טופס הנחה חדשה/עריכה */}
      <DiscountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        discount={currentDiscount}
        isEdit={isEdit}
        defaultLocation={location !== 'both' ? location : null}
      />

      {/* דיאלוג מחיקה */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>מחיקת הנחה</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את ההנחה "{currentDiscount?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>ביטול</Button>
          <Button onClick={handleDelete} color="error">מחיקה</Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג סטטיסטיקות */}
      <DiscountStats
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        location={location}
      />

      {/* דיאלוג צפייה */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>פרטי הנחה</DialogTitle>
        <DialogContent>
          {currentDiscount && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {currentDiscount.name}
              </Typography>
              
              {currentDiscount.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {currentDiscount.description}
                </Typography>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">סוג הנחה</Typography>
                  <Typography variant="body2">
                    {getDiscountTypeText(currentDiscount.discountType, currentDiscount.discountValue)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">מיקום</Typography>
                  <Typography variant="body2">
                    {getLocationText(currentDiscount.location)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">סוג תוקף</Typography>
                  <Typography variant="body2">
                    {currentDiscount.validityType === 'unlimited' ? 'ללא הגבלה' :
                     currentDiscount.validityType === 'date_range' ? 'טווח תאריכים' :
                     'רגע אחרון'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">עדיפות</Typography>
                  <Typography variant="body2">
                    {currentDiscount.priority}
                  </Typography>
                </Grid>
                
                {currentDiscount.usageLimit.maxUses && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">שימושים</Typography>
                      <Typography variant="body2">
                        {currentDiscount.usageLimit.currentUses} / {currentDiscount.usageLimit.maxUses}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">סטטוס</Typography>
                  <Typography variant="body2">
                    {currentDiscount.isActive ? 'פעיל' : 'לא פעיל'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>סגירה</Button>
          <Button onClick={() => {
            setViewOpen(false);
            handleEdit(currentDiscount);
          }} variant="contained">
            עריכה
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiscountManagement; 