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
  LocalOffer as DiscountIcon,
  FlightTakeoff as AirportIcon,
  Business as RothschildIcon,
  ViewModule as AllIcon,
  Home as HomeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import DiscountManagement from '../../components/discounts/DiscountManagement';

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
    { label: 'כל המיקומים', icon: <AllIcon />, location: 'both' },
    { label: 'שדה התעופה', icon: <AirportIcon />, location: 'airport' },
    { label: 'רוטשילד', icon: <RothschildIcon />, location: 'rothschild' }
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
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DiscountIcon color="primary" sx={{ fontSize: 40 }} />
          ניהול הנחות
        </Typography>
        <Typography variant="body1" color="text.secondary">
          נהל הנחות לכל המיקומים או בחר מיקום ספציפי. 
          צור הנחות חדשות, ערוך קיימות וקבל סטטיסטיקות על השימוש.
        </Typography>
      </Box>

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
                icon={tab.icon}
                iconPosition="start"
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

      {/* מידע נוסף */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DiscountIcon color="primary" />
            מידע על מערכת ההנחות
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                סוגי הנחות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • הנחה באחוזים - הנחה יחסית מהמחיר המלא<br/>
                • הנחה בשקלים - הנחה של סכום קבוע<br/>
                • הנחות ניתנות לשילוב או בלעדיות
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                תוקף הנחות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • ללא הגבלת זמן - הנחה קבועה<br/>
                • טווח תאריכים - הנחה לתקופה מוגדרת<br/>
                • רגע אחרון - הנחה לפני ההגעה
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                הגבלות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • מספר לילות מינימלי/מקסימלי<br/>
                • מספר אורחים מינימלי/מקסימלי<br/>
                • ימים בשבוע ספציפיים<br/>
                • תיירים או ישראלים בלבד
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                ניהול מתקדם
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • עדיפות הנחות (0-10)<br/>
                • הגבלת מספר שימושים<br/>
                • מעקב אחר היסטוריית שימוש<br/>
                • סטטיסטיקות ודוחות מפורטים
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default DiscountSettings; 