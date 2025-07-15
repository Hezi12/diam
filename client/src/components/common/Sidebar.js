import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  Tooltip, 
  styled,
  useMediaQuery,
  useTheme,
  IconButton,
  GlobalStyles,
  // SwipeableDrawer, - לא בשימוש יותר
  // נסיר את הקומפוננטות הקשורות לניווט התחתון
  // BottomNavigation,
  // BottomNavigationAction,
  // Paper
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EventNote as BookingsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  House as RothschildIcon,
  Flight as AirportIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  BarChart as RevenueIcon,
  Menu as MenuIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  SwapHoriz as MigrationIcon,
  Description as DocumentsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { STYLE_CONSTANTS } from '../../styles/StyleConstants';

const drawerWidth = 70;

// סטיילים לדסקטופ
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: STYLE_CONSTANTS.colors.background.paper,
    borderLeft: '1px solid #f0f0f0',
  },
}));

// עיצוב של הקישורים - מותאם למסך קטן במובייל
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: STYLE_CONSTANTS.colors.text.secondary,
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  padding: '8px 0', // ערך ביניים שמתאים גם למובייל וגם לדסקטופ
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: '#f5f5f7',
    color: STYLE_CONSTANTS.colors.airport.main,
  },
  '&.active': {
    color: STYLE_CONSTANTS.colors.airport.main,
    backgroundColor: STYLE_CONSTANTS.colors.airport.bgLight,
  },
  '&.submenu-active': {
    color: STYLE_CONSTANTS.colors.airport.main,
    backgroundColor: STYLE_CONSTANTS.colors.airport.bgLight,
  },

  // מדיה-קוורי לשינוי הפדינג במובייל
  [theme.breakpoints.down('md')]: {
    padding: '6px 0',
  },
}));

// הרכיב של פריט בתפריט צד
const SidebarItem = ({ icon, to, title, iconColor, onClick, isActive }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  
  return (
    <ListItem sx={{ 
      padding: isMobile ? '6px' : '8px', 
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <Tooltip title={title} placement="left">
        <StyledNavLink to={to} onClick={onClick} className={isActive ? 'submenu-active' : ''}>
          <ListItemIcon sx={{ 
            minWidth: 'auto', 
            justifyContent: 'center', 
            color: 'inherit',
            '& .MuiSvgIcon-root': {
              color: iconColor || 'inherit',
              transition: 'all 0.2s ease-in-out',
              fontSize: isMobile ? '1.8rem' : '1.5rem', // אייקונים גדולים יותר במובייל
            },
            '&:hover .MuiSvgIcon-root': {
              color: iconColor || STYLE_CONSTANTS.colors.airport.main,
            },
          }}>
            {icon}
          </ListItemIcon>
        </StyledNavLink>
      </Tooltip>
    </ListItem>
  );
};

// כפתור חזרה
const SidebarBackButton = ({ onClick, title }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  
  return (
    <ListItem sx={{ 
      padding: isMobile ? '6px' : '8px', 
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <Tooltip title={title} placement="left">
        <Box 
          component="button"
          onClick={onClick}
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: isMobile ? '8px 0' : '12px 0',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: STYLE_CONSTANTS.colors.text.secondary,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: '#f5f5f7',
              color: STYLE_CONSTANTS.colors.airport.main,
            },
            '& .MuiSvgIcon-root': {
              color: STYLE_CONSTANTS.colors.airport.main,
              fontSize: isMobile ? '1.8rem' : '1.5rem', // אייקון גדול יותר במובייל
            },
          }}
        >
          <ArrowBackIcon />
        </Box>
      </Tooltip>
    </ListItem>
  );
};

// רכיב כפתור יציאה
const LogoutButton = ({ onClick, iconColor }) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  
  return (
    <ListItem sx={{ 
      padding: isMobile ? '6px' : '8px', 
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <Tooltip title="התנתקות" placement="left">
        <Box 
          component="button"
          onClick={onClick}
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: isMobile ? '8px 0' : '12px 0',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: STYLE_CONSTANTS.colors.text.secondary,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: `rgba(${iconColor.replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
              color: iconColor,
            },
            '& .MuiSvgIcon-root': {
              color: iconColor,
              fontSize: isMobile ? '1.8rem' : '1.5rem', // אייקון גדול יותר במובייל
            },
          }}
        >
          <LogoutIcon />
        </Box>
      </Tooltip>
    </ListItem>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBookingSubMenu, setShowBookingSubMenu] = useState(false);
  const [showRevenueSubMenu, setShowRevenueSubMenu] = useState(false);
  // משתנה חדש לשליטה בפתיחה/סגירה של תת-תפריט הכנסות בלחיצה
  const [isRevenueMenuOpen, setIsRevenueMenuOpen] = useState(false);

  // לוגיקת התנתקות
  const handleLogout = () => {
    logout();
  };
  
  // כפתור חזרה
  const handleBack = () => {
    navigate(-1);
  };
  
  // פתיחה/סגירה של תפריט מובייל
  const toggleDrawer = (open) => (event) => {
    if (
      event && 
      event.type === 'keydown' && 
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setMobileOpen(open);
  };
  
  // פתיחה/סגירה של תת-תפריט ההכנסות
  const toggleRevenueSubmenu = () => {
    setIsRevenueMenuOpen(!isRevenueMenuOpen);
  };
  
  // בדיקה האם אנחנו בדף שצריך להציג בו כפתור חזרה
  const shouldShowBackButton = () => {
    // בדף של ניהול חדרים (airport או rothschild), נרצה להציג כפתור חזרה לדף הגדרות
    return location.pathname.includes('/settings/rooms/');
  };

  // צבעים לאייקונים בסרגל
  const iconColors = {
    dashboard: '#4A90E2', // כחול כהה יותר
    bookings: '#5E97F6', // כחול בהיר
    documents: '#34A853', // ירוק (היה invoices)
    revenue: '#9C27B0', // סגול
    rothschild: '#304dbd', // צבע רוטשילד מקורי
    airport: '#0059b3', // צבע אייפורט מקורי 
    email: '#FF5722', // כתום - מיילים
    settings: '#F5B400', // צהוב/כתום
    logout: '#EA4335', // אדום
    icount: '#00C853' // ירוק-iCount
  };

  useEffect(() => {
    // קובע האם להציג את תת-התפריט של ההזמנות
    setShowBookingSubMenu(location.pathname.includes('/bookings'));
    
    // קובע האם אנחנו נמצאים בדף פיננסי
    const isInFinancialSection = 
      location.pathname.includes('/revenue') || 
      location.pathname.includes('/capital') ||
      location.pathname.includes('/financial-overview');
    
    setShowRevenueSubMenu(isInFinancialSection);
    
    // סגירת תת-התפריט כשעוברים לדף שאינו פיננסי
    if (!isInFinancialSection) {
      setIsRevenueMenuOpen(false);
    }
    
    // כאשר עוברים לדף אחר, תת-התפריט נסגר במובייל
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location, isMobile]);

  // תת-תפריט הכנסות - יוצג רק אם הוא פתוח (בלחיצה)
  const renderRevenueSubmenu = () => {
    if (!isRevenueMenuOpen) return null;
    
    return (
      <>
        <SidebarItem
          to="/financial-overview"
          icon={<RevenueIcon />}
          title="סקירה פיננסית"
          onClick={isMobile ? toggleDrawer(false) : undefined}
        />
        <SidebarItem
          to="/capital"
          icon={<AccountBalanceWalletIcon />}
          title="ניהול הון"
          onClick={isMobile ? toggleDrawer(false) : undefined}
        />
      </>
    );
  };

  // תוכן המגירה (משותף בין דסקטופ למובייל)
  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        padding: isMobile ? '24px 10px 20px' : '20px 10px',
        position: 'relative',
      }}>
        {/* מבטלים את מרווח העליון במובייל */}
        {!isMobile && <Box sx={{ padding: '10px 0 10px' }} />}
        
        {isMobile && (
          <Box 
            sx={{
              position: 'absolute',
              top: 8,
              right: '50%',
              transform: 'translateX(50%)',
              width: 40,
              height: 4,
              borderRadius: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              mb: 2
            }} 
          />
        )}
        
        <List sx={{ 
          flexGrow: 1,
          padding: isMobile ? '8px 0' : '8px 0', // יותר פדינג ברשימה עצמה 
          '& .MuiListItem-root': {
            padding: isMobile ? '10px 5px' : '8px', // יותר מרווח בין פריטים במובייל
            marginBottom: isMobile ? '8px' : '0' // מרווח בין פריטים
          }
        }}>
          {shouldShowBackButton() && (
            <SidebarBackButton 
              onClick={handleBack}
              title="חזרה"
            />
          )}
          <SidebarItem
            icon={<DashboardIcon />}
            to="/dashboard"
            title="דאשבורד"
            iconColor={iconColors.dashboard}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<BookingsIcon />}
            to="/bookings"
            title="ניהול הזמנות"
            iconColor={iconColors.bookings}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          {/* הוסרו אייקוני מסמכים ומיגרציה */}
          
          {/* קבוצת הכנסות ופיננסים */}
          <SidebarItem
            icon={<RevenueIcon />}
            to="/revenue/monthly"
            title="דוחות פיננסיים"
            iconColor={iconColors.revenue}
            onClick={(e) => {
              // הפעלת פונקציית פתיחה/סגירה של תת-התפריט
              toggleRevenueSubmenu();
              
              // אם תת-התפריט לא פתוח, אז נאפשר ניווט לדף הראשון
              // אחרת, נמנע ניווט כי אנחנו רק סוגרים את התת-תפריט
              if (isRevenueMenuOpen) {
                e.preventDefault();
              }
              
              // סגירת התפריט במובייל אם פתוח
              if (isMobile) {
                toggleDrawer(false)(e);
              }
            }}
            // הדגשת הפריט אם תת-התפריט פתוח
            isActive={isRevenueMenuOpen}
          />
          {/* הצגת תת-תפריט הכנסות אם הוא מוצג */}
          {renderRevenueSubmenu()}
          
          {/* קבוצת אתרים ציבוריים */}
          <SidebarItem
            icon={<RothschildIcon />}
            to="/rothschild-booking"
            title="אתר Rothschild 79"
            iconColor={iconColors.rothschild}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
          <SidebarItem
            icon={<AirportIcon />}
            to="/airport-booking"
            title="אתר Airport Guest House"
            iconColor={iconColors.airport}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />

          <SidebarItem
            icon={<SettingsIcon />}
            to="/settings"
            title="הגדרות"
            iconColor={iconColors.settings}
            onClick={isMobile ? toggleDrawer(false) : undefined}
          />
        </List>
        
        <List sx={{ 
          padding: isMobile ? '8px 0' : '8px 0'  // יותר פדינג ברשימה של כפתור ההתנתקות
        }}>
          <LogoutButton 
            onClick={handleLogout}
            iconColor={iconColors.logout}
          />
        </List>
      </Box>
    </>
  );

  // במובייל
  if (isMobile) {
    return (
      <>
        {/* סגנונות גלובליים לאנימציות */}
        <GlobalStyles
          styles={{
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(0, 89, 179, 0.4)',
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(0, 89, 179, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(0, 89, 179, 0)',
              },
            },
            '@keyframes rotate': {
              '0%': {
                transform: 'rotate(0deg)',
              },
              '100%': {
                transform: 'rotate(360deg)',
              },
            },
            '@keyframes floating': {
              '0%': {
                transform: 'translateY(0px)',
              },
              '50%': {
                transform: 'translateY(-5px)',
              },
              '100%': {
                transform: 'translateY(0px)',
              },
            },
          }}
        />
        
        {/* כפתור פתיחה של התפריט במובייל - עכשיו בתחתית המסך */}
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: 20, 
            right: 20, 
            zIndex: 1200,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease',
            animation: 'floating 3s ease-in-out infinite',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'transparent',
              border: `2px solid ${STYLE_CONSTANTS.colors.airport.main}`,
              opacity: 0.3,
              animation: 'pulse 2s infinite',
            }
          }}
        >
          <IconButton 
            onClick={toggleDrawer(true)} 
            size="large"
            sx={{
              color: STYLE_CONSTANTS.colors.airport.main,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'transparent',
              },
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <MenuIcon sx={{ 
              fontSize: '2.2rem',
              transition: 'transform 0.3s ease',
              transform: mobileOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }} />
          </IconButton>
        </Box>
        
        {/* רקע כהה למסך כשהתפריט פתוח */}
        {mobileOpen && (
          <Box
            onClick={toggleDrawer(false)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1250,
              transition: 'opacity 0.3s ease',
              backdropFilter: 'blur(3px)',
            }}
          />
        )}
        
        {/* תפריט מותאם אישית */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: mobileOpen ? 0 : '-180px', // נפתח מימין לשמאל
            bottom: 0,
            width: '45%',
            maxWidth: '200px',
            minWidth: '160px',
            backgroundColor: STYLE_CONSTANTS.colors.background.paper,
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
            zIndex: 1300,
            transition: 'right 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            overflowY: 'auto',
            borderTopLeftRadius: '16px',
            borderBottomLeftRadius: '16px',
            backdropFilter: 'blur(10px)',
            // למראה זכוכיתי אם המכשיר תומך
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          {drawerContent}
        </Box>
      </>
    );
  }

  // בדסקטופ
  return (
    <StyledDrawer variant="permanent" anchor="right">
      {drawerContent}
    </StyledDrawer>
  );
};

export default Sidebar; 