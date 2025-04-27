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
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import Settings from './pages/Settings';
import AirportRooms from './pages/settings/rooms/AirportRooms';
import RothschildRooms from './pages/settings/rooms/RothschildRooms';
import AirportSite from './pages/AirportSite';
import RothschildSite from './pages/RothschildSite';

// קומפוננטים של מערכת העיצוב החדשה
import DesignSystem from './design-system/DesignSystem';
import DesignExamples from './design-system/examples/DesignExamples';
import BookingCalendarExamples from './design-system/examples/BookingCalendarExamples';

// רכיבים נוספים
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import { useAuth } from './context/AuthContext';

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
          <Routes>
            {/* ניתוב לדף התחברות */}
            <Route path="/login" element={<Login />} />
            
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
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Invoices />
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
            
            {/* ניתובים למערכת העיצוב החדשה */}
            <Route
              path="/design-system"
              element={
                <ProtectedRoute>
                  <DesignSystem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/design-examples"
              element={
                <ProtectedRoute>
                  <DesignExamples />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-calendar-examples"
              element={
                <ProtectedRoute>
                  <BookingCalendarExamples />
                </ProtectedRoute>
              }
            />
            
            {/* ניתוב ברירת מחדל */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
}

export default App; 