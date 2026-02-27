import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import { format, startOfMonth, getMonth, getYear } from 'date-fns';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FlightIcon from '@mui/icons-material/Flight';
import HomeIcon from '@mui/icons-material/Home';

// קומפוננטות לתצוגת הדוח
import RevenueSummaryCards from '../../components/revenue/RevenueSummaryCards';
import DailyRevenueChart from '../../components/revenue/DailyRevenueChart';
import RevenueTrendChart from '../../components/revenue/RevenueTrendChart';
import OccupancyChart from '../../components/revenue/OccupancyChart';
import PaymentMethodChart from '../../components/revenue/PaymentMethodChart';
import RoomRevenueChart from '../../components/revenue/RoomRevenueChart';
import RevenueDateNavigation from '../../components/revenue/RevenueDateNavigation';
import RevenueTabs from '../../components/revenue/RevenueTabs';

// סרוויס לקבלת נתונים
import { getMonthlyRevenueData } from '../../services/revenueService';

// פאנל לטעינת נתונים
const LoadingPanel = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: { xs: '200px', sm: '300px' } }}>
    <CircularProgress />
  </Box>
);

/**
 * דף סיכום הכנסות חודשי
 * מציג נתוני הכנסות, תפוסה ונתונים נוספים לפי חודש ומתחם
 */
const MonthlyRevenue = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSite, setSelectedSite] = useState(0); // 0 = רוטשילד, 1 = שדה התעופה
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);

  // שמות המתחמים
  const sites = ['rothschild', 'airport'];
  const siteNames = ['רוטשילד', 'שדה התעופה'];

  // טוען נתונים בעת שינוי תאריך או מתחם
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const month = getMonth(selectedDate) + 1; // date-fns מחזיר חודשים מ-0 עד 11
        const year = getYear(selectedDate);
        const site = sites[selectedSite];
        
        // קבלת הנתונים מהשרת
        const data = await getMonthlyRevenueData(site, year, month);
        setRevenueData(data);
      } catch (error) {
        console.error('שגיאה בטעינת נתוני הכנסות:', error);
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

  // מזהה המיקום הנוכחי (rothschild/airport)
  const currentLocation = sites[selectedSite];

  return (
    <Box sx={{ py: 3, px: 2 }}>
      {/* כותרת ראשית ואזור הניווט */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRadius: '10px',
        p: 1,
        mb: 3,
        gap: isMobile ? 1 : 0,
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
          הכנסות
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
            {/* כרטיסיות סיכום */}
            <RevenueSummaryCards data={revenueData.summary} />

            <Grid container spacing={3}>
              {/* גרף הכנסות יומיות */}
              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, height: '100%', boxShadow: theme.shadows[1] }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                    הכנסות יומיות
                  </Typography>
                  <DailyRevenueChart data={revenueData.dailyRevenue} />
                </Paper>
              </Grid>

              {/* פילוח לפי אמצעי תשלום */}
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, height: '100%', boxShadow: theme.shadows[1] }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                    אמצעי תשלום
                  </Typography>
                  <PaymentMethodChart data={revenueData.paymentMethods} />
                </Paper>
              </Grid>

              {/* גרף מגמות והשוואה לחודשים קודמים */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[1] }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                    השוואה לחודשים קודמים
                  </Typography>
                  <RevenueTrendChart data={revenueData.trends} />
                </Paper>
              </Grid>

              {/* נתוני תפוסה */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[1] }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                    אחוזי תפוסה
                  </Typography>
                  <OccupancyChart data={revenueData.occupancy} />
                </Paper>
              </Grid>

              {/* הכנסות לפי חדרים */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[1] }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                    הכנסות לפי חדרים
                  </Typography>
                  <RoomRevenueChart data={revenueData.roomRevenue} />
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
    </Box>
  );
};

export default MonthlyRevenue; 