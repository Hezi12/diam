import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, StyledEngineProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './theme';

// קומפוננטים לעמודים
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Login from './pages/Login';
import Settings from './pages/settings/Settings';
import AirportRooms from './pages/settings/rooms/AirportRooms';
import RothschildRooms from './pages/settings/rooms/RothschildRooms';

import Cleaning from './pages/Cleaning';
import QuickBooking from './pages/QuickBooking';
import MonthlyRevenue from './pages/revenue/MonthlyRevenue';
import FinancialOverview from './pages/revenue/FinancialOverview';
import CapitalManagement from './pages/revenue/CapitalManagement';
import EmailPreview from './pages/email/EmailPreview';

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

// רכיבים נוספים
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLanguageProvider } from './contexts/PublicLanguageContext';
import { LanguageProvider } from './contexts/LanguageContext';

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
    
    // האזנה לשינויי נתיב כדי לשחזר RTL אחרי יציאה מהאתר הציבורי
    const handleRouteChange = () => {
      if (!window.location.pathname.startsWith('/airport-booking')) {
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
            <LanguageProvider>
              <Routes>
              {/* ניתוב לדף התחברות */}
              <Route path="/login" element={<Login />} />
              
              {/* דף ניקיון - ללא אבטחה */}
              <Route path="/cleaning" element={<Cleaning />} />
              
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
                path="/email-preview"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EmailPreview />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* ניתוב ברירת מחדל */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </LanguageProvider>
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