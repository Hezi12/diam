import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, StyledEngineProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './theme';
import { HelmetProvider } from 'react-helmet-async';

// קומפוננטים לעמודים
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Login from './pages/Login';
import Settings from './pages/settings/Settings';
import AirportRooms from './pages/settings/rooms/AirportRooms';
import RothschildRooms from './pages/settings/rooms/RothschildRooms';
import DiscountSettings from './pages/settings/DiscountSettings';
import SyncSettings from './pages/settings/SyncSettings';

import Cleaning from './pages/Cleaning';
import QuickBooking from './pages/QuickBooking';
import MonthlyRevenue from './pages/revenue/MonthlyRevenue';
import FinancialOverview from './pages/revenue/FinancialOverview';
import CapitalManagement from './pages/revenue/CapitalManagement';
import EmailPreview from './pages/email/EmailPreview';
import Messages from './pages/Messages';

// עמודי אתר ציבורי - Airport
import HomePage from './pages/public-site/HomePage';
import SearchResultsPage from './pages/public-site/SearchResultsPage';
import BookingFormPage from './pages/public-site/BookingFormPage';
import ConfirmationPage from './pages/public-site/ConfirmationPage';
import GalleryPage from './pages/public-site/GalleryPage';
import FAQDetailsPage from './pages/public-site/FAQDetailsPage';

// עמודי אתר ציבורי - Rothschild
import RothschildHomePage from './pages/public-site/RothschildHomePage';
import RothschildSearchResultsPage from './pages/public-site/RothschildSearchResultsPage';
import RothschildBookingFormPage from './pages/public-site/RothschildBookingFormPage';
import RothschildConfirmationPage from './pages/public-site/RothschildConfirmationPage';
import RothschildGalleryPage from './pages/public-site/RothschildGalleryPage';
import RothschildFAQDetailsPage from './pages/public-site/RothschildFAQDetailsPage';
import PublicNoticeBoard from './pages/public-site/PublicNoticeBoard';

// רכיבים נוספים
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLanguageProvider } from './contexts/PublicLanguageContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { FilterProvider } from './contexts/FilterContext';

// יצירת cache רק ל-RTL (דפי הניהול)
const createEmotionCache = () => {
  return createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  });
};

// רכיב עוטף עם RTL קבוע לדפי הניהול
const AppContent = () => {
  const cache = React.useMemo(() => createEmotionCache(), []);

  // הגדרת כיוון RTL קבוע עבור דפי הניהול
  React.useEffect(() => {
    // נקבע RTL בכל מקרה בתחילה
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
    
    // האזנה לשינויי נתיב כדי לשחזר RTL אחרי יציאה מהאתרים הציבוריים
    const handleRouteChange = () => {
      const isPublicSite = window.location.pathname.startsWith('/airport-booking') || 
                           window.location.pathname.startsWith('/rothschild-booking');
      
      // אם לא באתר ציבורי, תמיד נחזיר ל-RTL
      if (!isPublicSite) {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'he';
      }
    };
    
    // ביצוע הבדיקה גם כאשר האתר נטען
    handleRouteChange();
    
    // האזנה לשינויי history
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <CacheProvider value={cache} key="rtl">
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <FilterProvider>
              <LanguageProvider>
                <HelmetProvider>
                <Routes>
                {/* ניתוב לדף התחברות */}
                <Route path="/login" element={<Login />} />
                
                {/* דף ניקיון - ללא אבטחה */}
                <Route path="/cleaning" element={<Cleaning />} />
                
                {/* לוח מודעות ציבורי - ללא אבטחה */}
                <Route path="/notice-board-public" element={<PublicNoticeBoard />} />
                
                {/* נתיבי האתר הציבורי - עם קונטקסט שפה מבודד */}
                <Route path="/airport-booking" element={
                  <PublicLanguageProvider>
                    <HomePage />
                  </PublicLanguageProvider>
                } />
                <Route path="/airport-booking/search-results" element={
                  <PublicLanguageProvider>
                    <SearchResultsPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/airport-booking/book" element={
                  <PublicLanguageProvider>
                    <BookingFormPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/airport-booking/confirmation" element={
                  <PublicLanguageProvider>
                    <ConfirmationPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/airport-booking/gallery" element={
                  <PublicLanguageProvider>
                    <GalleryPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/airport-booking/faq-details" element={
                  <PublicLanguageProvider>
                    <FAQDetailsPage />
                  </PublicLanguageProvider>
                } />
                
                {/* נתיבי האתר הציבורי של רוטשילד - עם קונטקסט שפה מבודד */}
                <Route path="/rothschild-booking" element={
                  <PublicLanguageProvider>
                    <RothschildHomePage />
                  </PublicLanguageProvider>
                } />
                <Route path="/rothschild-booking/search-results" element={
                  <PublicLanguageProvider>
                    <RothschildSearchResultsPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/rothschild-booking/book" element={
                  <PublicLanguageProvider>
                    <RothschildBookingFormPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/rothschild-booking/confirmation" element={
                  <PublicLanguageProvider>
                    <RothschildConfirmationPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/rothschild-booking/gallery" element={
                  <PublicLanguageProvider>
                    <RothschildGalleryPage />
                  </PublicLanguageProvider>
                } />
                <Route path="/rothschild-booking/faq-details" element={
                  <PublicLanguageProvider>
                    <RothschildFAQDetailsPage />
                  </PublicLanguageProvider>
                } />
                
                {/* ניתובים לעמודים מוגנים */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Bookings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/quick-booking"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <QuickBooking />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/rooms/airport"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AirportRooms />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/rooms/rothschild"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <RothschildRooms />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/discounts"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DiscountSettings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/sync"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SyncSettings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />


                <Route
                  path="/revenue"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MonthlyRevenue />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/financial-overview"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <FinancialOverview />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/revenue/monthly"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <MonthlyRevenue />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/revenue/overview"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <FinancialOverview />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/capital"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CapitalManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Messages />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/email-preview"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <EmailPreview />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                
                {/* ניתוב ברירת מחדל - רק למשתמשים מחוברים */}
                <Route 
                  path="*" 
                  element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard" replace />
                    </ProtectedRoute>
                  } 
                />
                </Routes>
              </HelmetProvider>
            </LanguageProvider>
          </FilterProvider>
        </AuthProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
};

/**
 * App component - הרכיב הראשי של האפליקציה
 */
function App() {
  return <AppContent />;
}

export default App; 