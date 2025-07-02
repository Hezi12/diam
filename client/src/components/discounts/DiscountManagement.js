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
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  Collapse,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalOffer as DiscountIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  DateRange as DateRangeIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  PowerSettingsNew as PowerIcon,
  ExpandLess,
  ExpandMore,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { he } from 'date-fns/locale';
import DiscountForm from './DiscountForm';
import DiscountStats from './DiscountStats';

/**
 * ממשק ניהול הנחות מתקדם
 * מאפשר יצירה, עריכה, צפייה ומחיקה של הנחות
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
    if (!currentDiscount) return;
    
    try {
      await axios.delete(`/api/discounts/${currentDiscount._id}`);
      setSuccess('ההנחה נמחקה בהצלחה');
      setDeleteOpen(false);
      setCurrentDiscount(null);
      fetchDiscounts();
      fetchStats();
    } catch (err) {
      console.error('שגיאה במחיקת הנחה:', err);
      setError(err.response?.data?.message || 'שגיאה במחיקת ההנחה');
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      await axios.patch(`/api/discounts/${discount._id}/toggle-status`);
      setSuccess(`ההנחה ${discount.isActive ? 'נוטרלה' : 'הופעלה'} בהצלחה`);
      fetchDiscounts();
      fetchStats();
    } catch (err) {
      console.error('שגיאה בשינוי סטטוס הנחה:', err);
      setError('שגיאה בשינוי סטטוס ההנחה');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (isEdit) {
        await axios.put(`/api/discounts/${currentDiscount._id}`, formData);
        setSuccess('ההנחה עודכנה בהצלחה');
      } else {
        await axios.post('/api/discounts', formData);
        setSuccess('ההנחה נוצרה בהצלחה');
      }
      
      setFormOpen(false);
      setCurrentDiscount(null);
      fetchDiscounts();
      fetchStats();
    } catch (err) {
      console.error('שגיאה בשמירת הנחה:', err);
      setError(err.response?.data?.message || 'שגיאה בשמירת ההנחה');
    }
  };

  // פונקציות עזר
  const getValidityStatus = (discount) => {
    const now = new Date();
    
    switch (discount.validityType) {
      case 'unlimited':
        return { status: 'active', text: 'ללא הגבלת זמן', color: 'success' };
        
      case 'date_range':
        const validFrom = parseISO(discount.validFrom);
        const validUntil = parseISO(discount.validUntil);
        
        if (isBefore(now, validFrom)) {
          return { status: 'upcoming', text: 'עתידית', color: 'info' };
        } else if (isAfter(now, validUntil)) {
          return { status: 'expired', text: 'פגה תוקף', color: 'error' };
        } else {
          return { status: 'active', text: 'פעילה', color: 'success' };
        }
        
      case 'last_minute':
        return { status: 'active', text: 'רגע אחרון', color: 'warning' };
        
      default:
        return { status: 'unknown', text: 'לא ידוע', color: 'default' };
    }
  };

  const getDiscountTypeText = (type, value) => {
    if (type === 'percentage') {
      return `${value}%`;
    } else if (type === 'fixed_amount') {
      return `₪${value}`;
    }
    return '';
  };

  const getLocationText = (loc) => {
    switch (loc) {
      case 'airport': return 'שדה התעופה';
      case 'rothschild': return 'רוטשילד';
      case 'both': return 'שני המיקומים';
      default: return loc;
    }
  };

  const handleCopyDiscount = async (discount) => {
    const copiedDiscount = {
      ...discount,
      name: `עותק של ${discount.name}`,
      isActive: false // עותק מתחיל כלא פעיל
    };
    
    // הסרת שדות שלא צריכים להיות בעותק
    delete copiedDiscount._id;
    delete copiedDiscount.createdAt;
    delete copiedDiscount.updatedAt;
    delete copiedDiscount.createdBy;
    delete copiedDiscount.usageHistory;
    copiedDiscount.usageLimit.currentUses = 0;
    
    try {
      await axios.post('/api/discounts', copiedDiscount);
      setSuccess('ההנחה הועתקה בהצלחה');
      fetchDiscounts();
    } catch (err) {
      console.error('שגיאה בהעתקת הנחה:', err);
      setError('שגיאה בהעתקת ההנחה');
    }
  };

  // רינדור רכיבים
  const renderDiscountCard = (discount) => {
    const validityStatus = getValidityStatus(discount);
    
    return (
      <Card key={discount._id} sx={{ mb: 2, opacity: discount.isActive ? 1 : 0.7 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DiscountIcon color={discount.isActive ? 'primary' : 'disabled'} />
                {discount.name}
              </Typography>
              
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
                    icon={<LocationIcon />}
                    label={getLocationText(discount.location)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Chip
                    icon={<ScheduleIcon />}
                    label={validityStatus.text}
                    color={validityStatus.color}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Chip
                    icon={<TrendingUpIcon />}
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
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={discount.isActive}
                    onChange={() => handleToggleStatus(discount)}
                    color="primary"
                  />
                }
                label={discount.isActive ? 'פעיל' : 'לא פעיל'}
                labelPlacement="start"
                sx={{ m: 0 }}
              />
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="צפייה">
                  <IconButton size="small" onClick={() => handleView(discount)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="עריכה">
                  <IconButton size="small" onClick={() => handleEdit(discount)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="העתקה">
                  <IconButton size="small" onClick={() => handleCopyDiscount(discount)}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="מחיקה">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteClick(discount)}
                    disabled={discount.usageLimit.currentUses > 0}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderFilters = () => (
    <Collapse in={showFilters}>
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>פילטרים</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <select
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">כל המיקומים</option>
              <option value="airport">שדה התעופה</option>
              <option value="rothschild">רוטשילד</option>
              <option value="both">שני המיקומים</option>
            </select>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">כל הסטטוסים</option>
              <option value="true">פעילות</option>
              <option value="false">לא פעילות</option>
            </select>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <select
              value={filters.validityType}
              onChange={(e) => setFilters(prev => ({ ...prev, validityType: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">כל סוגי התוקף</option>
              <option value="unlimited">ללא הגבלה</option>
              <option value="date_range">טווח תאריכים</option>
              <option value="last_minute">רגע אחרון</option>
            </select>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <input
              type="text"
              placeholder="חיפוש לפי שם..."
              value={filters.searchText}
              onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </Grid>
        </Grid>
      </Card>
    </Collapse>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* כותרת וכפתורים */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DiscountIcon color="primary" />
          ניהול הנחות
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowFilters(!showFilters)}
            variant="outlined"
          >
            פילטרים
          </Button>
          
          <Button
            startIcon={<AssessmentIcon />}
            onClick={() => setStatsOpen(true)}
            variant="outlined"
          >
            סטטיסטיקות
          </Button>
          
          <Button
            startIcon={<AddIcon />}
            onClick={handleAdd}
            variant="contained"
          >
            הנחה חדשה
          </Button>
        </Box>
      </Box>

      {/* הודעות */}
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

      {/* פילטרים */}
      {renderFilters()}

      {/* סטטיסטיקות מהירות */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="primary">{stats.totalDiscounts}</Typography>
              <Typography variant="caption">סה״כ הנחות</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="success.main">{stats.activeDiscounts}</Typography>
              <Typography variant="caption">פעילות</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="warning.main">{stats.totalUsages}</Typography>
              <Typography variant="caption">שימושים</Typography>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" color="info.main">₪{Math.round(stats.totalSavings)}</Typography>
              <Typography variant="caption">חיסכון כולל</Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* רשימת הנחות */}
      <Box>
        {filteredDiscounts.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <DiscountIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {discounts.length === 0 ? 'אין הנחות במערכת' : 'לא נמצאו הנחות התואמות לפילטרים'}
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAdd}
              variant="contained"
              sx={{ mt: 2 }}
            >
              צור הנחה ראשונה
            </Button>
          </Card>
        ) : (
          filteredDiscounts.map(renderDiscountCard)
        )}
      </Box>

      {/* כפתור צף למובייל */}
      {isMobile && (
        <Zoom in={true}>
          <Fab
            color="primary"
            onClick={handleAdd}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      )}

      {/* דיאלוגים */}
      <DiscountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        discount={currentDiscount}
        isEdit={isEdit}
        defaultLocation={location !== 'both' ? location : undefined}
      />

      <DiscountStats
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        location={location}
      />

      {/* דיאלוג מחיקה */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>מחיקת הנחה</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את ההנחה "{currentDiscount?.name}"?
          </Typography>
          {currentDiscount?.usageLimit.currentUses > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              ההנחה כבר נוצלה {currentDiscount.usageLimit.currentUses} פעמים.
              מחיקתה תמחק גם את ההיסטוריה.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>ביטול</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            מחיקה
          </Button>
        </DialogActions>
      </Dialog>

      {/* דיאלוג צפייה */}
      {viewOpen && currentDiscount && (
        <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>פרטי הנחה - {currentDiscount.name}</DialogTitle>
          <DialogContent>
            {/* תוכן מפורט של ההנחה יוצג כאן */}
            <Typography variant="body1">
              פרטים מלאים על ההנחה יוצגו כאן...
            </Typography>
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
      )}
    </Box>
  );
};

export default DiscountManagement; 