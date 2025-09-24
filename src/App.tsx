import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAutoPageTranslation, TranslationProvider, useTranslation } from './contexts/TranslationContext';
import MainLayout from './layouts/MainLayout';
import Hero from './components/Hero';
import Features from './components/Features';
import Hardware from './components/Hardware';
import Team from './components/Team';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import CaretakerDashboard from './components/CaretakerDashboard';
import AdminDashboard from './components/AdminDashboard';

function AppInner() {
  useAutoPageTranslation();
  const { translatePage } = useTranslation();
  const location = useLocation();
  // Translate on route change as well
  useEffect(() => {
    if (translatePage) translatePage();
  }, [location, translatePage]);
  return (
    <Routes>
      {/* Home page with all components */}
      <Route path="/" element={
        <MainLayout>
          <Hero />
          <Features />
          <Hardware />
          <Team />
        </MainLayout>
      } />
      
      {/* Dashboard routes */}
      <Route path="/patient-dashboard" element={<PatientDashboard />} />
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/caretaker-dashboard" element={<CaretakerDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <TranslationProvider>
          <Router>
            <AppInner />
          </Router>
        </TranslationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;