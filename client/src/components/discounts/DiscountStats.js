import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  useTheme,
  Tab,
  Tabs,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  LocalOffer as DiscountIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import axios from 'axios';

/**
 * קומפוננט סטטיסטיקות מתקדם להנחות
 */
const DiscountStats = ({ open, onClose, location = 'both' }) => {
  const theme = useTheme();
  
  // State נתונים
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [usageReport, setUsageReport] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // צבעים לגרפים
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  // טעינת נתונים
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (location !== 'both') params.append('location', location);
      
      const [statsResponse, usageResponse] = await Promise.all([
        axios.get(`/api/discounts/stats/overview?${params.toString()}`),
        axios.get(`/api/discounts/stats/usage-report?${params.toString()}`)
      ]);
      
      setStats(statsResponse.data);
      setUsageReport(usageResponse.data);
      
    } catch (error) {
      console.error('שגיאה בטעינת סטטיסטיקות:', error);
    } finally {
      setLoading(false);
    }
  };

  // רענון נתונים
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // טעינה ראשונית
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, location]);

  // הכנת נתונים לגרפים
  const getTypeChartData = () => {
    if (!stats?.discountsByType) return [];
    
    return Object.entries(stats.discountsByType).map(([type, count]) => ({
      name: type === 'percentage' ? 'אחוזים' : 'סכום קבוע',
      value: count,
      percentage: Math.round((count / stats.totalDiscounts) * 100)
    }));
  };

  const getValidityChartData = () => {
    if (!stats?.discountsByValidity) return [];
    
    const labels = {
      unlimited: 'ללא הגבלה',
      date_range: 'טווח תאריכים',
      last_minute: 'רגע אחרון'
    };
    
    return Object.entries(stats.discountsByValidity).map(([type, count]) => ({
      name: labels[type] || type,
      value: count,
      percentage: Math.round((count / stats.totalDiscounts) * 100)
    }));
  };

  // רינדור כרטיסי סטטיסטיקות
  const renderStatsCards = () => (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <Card sx={{ textAlign: 'center', height: '100%' }}>
          <CardContent>
            <DiscountIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary.main">
              {stats?.totalDiscounts || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              סה״כ הנחות
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} md={3}>
        <Card sx={{ textAlign: 'center', height: '100%' }}>
          <CardContent>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {stats?.activeDiscounts || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              פעילות כעת
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} md={3}>
        <Card sx={{ textAlign: 'center', height: '100%' }}>
          <CardContent>
            <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" color="info.main">
              {stats?.totalUsages || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              שימושים כולל
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} md={3}>
        <Card sx={{ textAlign: 'center', height: '100%' }}>
          <CardContent>
            <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" color="warning.main">
              ₪{Math.round(stats?.totalSavings || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              חיסכון כולל
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ממוצע חיסכון לשימוש
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" color="primary">
              ₪{stats?.averageSavingsPerUsage || 0}
            </Typography>
            <Chip 
              label={`${stats?.totalUsages || 0} שימושים`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            שיעור שימוש
          </Typography>
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {stats?.activeDiscounts || 0} הנחות פעילות מתוך {stats?.totalDiscounts || 0}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={stats?.totalDiscounts > 0 ? (stats.activeDiscounts / stats.totalDiscounts) * 100 : 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Card>
      </Grid>
    </Grid>
  );

  // רינדור גרפים
  const renderCharts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            הנחות לפי סוג
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getTypeChartData()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {getTypeChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            הנחות לפי תוקף
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getValidityChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="value" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>
    </Grid>
  );

  // רינדור דוח שימוש
  const renderUsageReport = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          דוח שימוש בהנחות
        </Typography>
        <Box>
          <Chip 
            label={`${usageReport?.totalUsages || 0} שימושים`}
            color="primary"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`₪${Math.round(usageReport?.totalSavings || 0)} חיסכון`}
            color="success"
          />
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>הנחה</TableCell>
              <TableCell>הזמנה</TableCell>
              <TableCell>אורח</TableCell>
              <TableCell>תאריכים</TableCell>
              <TableCell align="right">חיסכון</TableCell>
              <TableCell>תאריך שימוש</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usageReport?.usages?.map((usage, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {usage.discountName}
                    </Typography>
                    <Chip 
                      label={usage.discountType === 'percentage' ? 
                        `${usage.discountValue}%` : 
                        `₪${usage.discountValue}`
                      }
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {usage.bookingNumber || 'לא זמין'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {usage.guestName || 'לא זמין'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {usage.checkIn && format(parseISO(usage.checkIn), 'dd/MM', { locale: he })}
                    {usage.checkOut && ` - ${format(parseISO(usage.checkOut), 'dd/MM', { locale: he })}`}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    ₪{Math.round(usage.discountAmount || 0)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {format(parseISO(usage.usedAt), 'dd/MM/yy HH:mm', { locale: he })}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {(!usageReport?.usages || usageReport.usages.length === 0) && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            אין נתוני שימוש
          </Typography>
          <Typography variant="body2" color="text.secondary">
            עדיין לא נעשה שימוש בהנחות במערכת
          </Typography>
        </Box>
      )}
    </Box>
  );

  // רינדור תוכן הטאב
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            {renderStatsCards()}
            <Divider sx={{ my: 3 }} />
            {renderCharts()}
          </Box>
        );
      case 1:
        return renderUsageReport();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="h6">
            סטטיסטיקות הנחות
            {location !== 'both' && (
              <Chip 
                label={location === 'airport' ? 'שדה התעופה' : 'רוטשילד'}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="רענון נתונים">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="הורדת דוח">
            <IconButton disabled>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="סקירה כללית" />
            <Tab label="דוח שימוש" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {renderTabContent()}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>סגירה</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountStats; 