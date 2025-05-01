import React from 'react';
import { Grid, Paper, Box, Typography, useTheme } from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';

/**
 * מציג כרטיסיות סיכום לנתוני הכנסות ותחזיות
 * @param {Object} props.data - נתוני הסיכום (הכנסות נוכחיות, תחזית, ממוצע יומי)
 */
const RevenueSummaryCards = ({ data }) => {
  const theme = useTheme();

  // פונקציה לעיצוב אחוז שינוי
  const renderChangePercent = (percent) => {
    const isPositive = percent > 0;
    const color = isPositive ? 'success.main' : 'error.main';
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color }}>
        <Icon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="body2" component="span" sx={{ fontWeight: 'medium', color }}>
          {isPositive ? '+' : ''}{percent}%
        </Typography>
      </Box>
    );
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* כרטיסיית הכנסות נוכחיות */}
      <Grid item xs={12} sm={6} md={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            height: '100%', 
            borderRadius: 2, 
            boxShadow: theme.shadows[1],
            borderLeft: '4px solid', 
            borderColor: 'primary.main' 
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" color="text.secondary">
              הכנסות החודש
            </Typography>
            <MoneyIcon color="primary" />
          </Box>
          
          <Typography variant="h4" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
            ₪{data.currentRevenue.toLocaleString()}
          </Typography>
          
          {renderChangePercent(data.currentRevenueChange)}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ביחס לחודש קודם
          </Typography>
        </Paper>
      </Grid>

      {/* כרטיסיית תחזית הכנסות */}
      <Grid item xs={12} sm={6} md={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            height: '100%', 
            borderRadius: 2, 
            boxShadow: theme.shadows[1],
            borderLeft: '4px solid', 
            borderColor: 'secondary.main' 
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" color="text.secondary">
              תחזית לסוף החודש
            </Typography>
            <CalendarIcon color="secondary" />
          </Box>
          
          <Typography variant="h4" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
            ₪{data.forecast.toLocaleString()}
          </Typography>
          
          {renderChangePercent(data.forecastChange)}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            לפי {data.daysPassed} ימים שחלפו
          </Typography>
        </Paper>
      </Grid>

      {/* כרטיסיית הכנסה יומית ממוצעת */}
      <Grid item xs={12} sm={6} md={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            height: '100%', 
            borderRadius: 2, 
            boxShadow: theme.shadows[1],
            borderLeft: '4px solid', 
            borderColor: 'success.main' 
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" color="text.secondary">
              הכנסה יומית ממוצעת
            </Typography>
            <MoneyIcon color="success" />
          </Box>
          
          <Typography variant="h4" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
            ₪{data.dailyAverage.toLocaleString()}
          </Typography>
          
          {renderChangePercent(data.dailyAverageChange)}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ביחס לחודש קודם
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default RevenueSummaryCards; 