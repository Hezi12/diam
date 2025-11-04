import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
  LocalOffer as DiscountIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import DiscountManagement from '../../components/discounts/DiscountManagement';
import LaunchBannerControl from '../../components/discounts/LaunchBannerControl';
import DirectBookingBannerControl from '../../components/discounts/DirectBookingBannerControl';

/**
 * עמוד הגדרות הנחות
 * מאפשר ניהול הנחות לכל המיקומים או למיקום ספציפי
 */
const DiscountSettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);

  // מיפוי טאבים למיקומים
  const tabs = [
    { label: 'כל המיקומים', location: 'both' },
    { label: 'שדה התעופה', location: 'airport' },
    { label: 'רוטשילד', location: 'rothschild' }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ניווט Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          דשבורד
        </Link>
        <Link component={RouterLink} to="/settings" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SettingsIcon fontSize="small" />
          הגדרות
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DiscountIcon fontSize="small" />
          הנחות
        </Typography>
      </Breadcrumbs>

      {/* כותרת ראשית */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          ניהול הנחות
        </Typography>
      </Box>

      {/* בקרת באנר הנחת השקה */}
      <LaunchBannerControl />

      <Divider sx={{ my: 3 }} />

      {/* בקרת באנר הנחת הזמנה ישירה */}
      <DirectBookingBannerControl />

      <Divider sx={{ mb: 3 }} />

      {/* תוכן ראשי */}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        {/* טאבים */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                sx={{ 
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* תוכן הטאב */}
        <Box sx={{ p: 0 }}>
          <DiscountManagement location={tabs[activeTab].location} />
        </Box>
      </Paper>
    </Box>
  );
};

export default DiscountSettings; 