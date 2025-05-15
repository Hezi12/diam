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
import AirportSite from './pages/sites/AirportSite';
import RothschildSite from './pages/sites/RothschildSite';
import Cleaning from './pages/Cleaning';
import QuickBooking from './pages/QuickBooking';
import MonthlyRevenue from './pages/revenue/MonthlyRevenue';
import FinancialOverview from './pages/revenue/FinancialOverview';
import CapitalManagement from './pages/revenue/CapitalManagement';

// עמודי אתר ציבורי
import HomePage from './pages/public-site/HomePage';
import SearchResultsPage from './pages/public-site/SearchResultsPage';
import BookingFormPage from './pages/public-site/BookingFormPage';
import ConfirmationPage from './pages/public-site/ConfirmationPage';
import GalleryPage from './pages/public-site/GalleryPage';
import AboutContactPage from './pages/public-site/AboutContactPage';

// רכיבים נוספים
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import { AuthProvider } from './contexts/AuthContext';

// יצירת קונפיגורציה לתמיכה בכיוון RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

/**
 * App component - הרכיב הראשי של האפליקציה
 * 
 * רכיב זה מגדיר את כל הניתובים של האפליקציה
 * ומייבא את הקומפוננטים הרלוונטיים לכל עמוד
 */
function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <Routes>
              {/* ניתוב לדף התחברות */}
              <Route path="/login" element={<Login />} />
              
              {/* דף ניקיון - ללא אבטחה */}
              <Route path="/cleaning" element={<Cleaning />} />
              
              {/* נתיבי האתר הציבורי - ללא אבטחה */}
              <Route path="/airport-booking" element={<HomePage />} />
              <Route path="/airport-booking/search-results" element={<SearchResultsPage />} />
              <Route path="/airport-booking/book" element={<BookingFormPage />} />
              <Route path="/airport-booking/confirmation" element={<ConfirmationPage />} />
              <Route path="/airport-booking/gallery" element={<GalleryPage />} />
              <Route path="/airport-booking/about-contact" element={<AboutContactPage />} />
              
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
                path="/rothschild-site"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <RothschildSite />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/airport-site"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AirportSite />
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
              
              {/* ניתוב ברירת מחדל */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
}

export default App; 