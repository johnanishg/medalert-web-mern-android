import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './layouts/MainLayout';
import Hero from './components/Hero';
import Features from './components/Features';
import Hardware from './components/Hardware';
import Demo from './components/Demo';
import Team from './components/Team';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import CaretakerDashboard from './components/CaretakerDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Home page with all components */}
            <Route path="/" element={
              <MainLayout>
                <Hero />
                <Features />
                <Hardware />
                <Demo />
                <Team />
              </MainLayout>
            } />
            
            {/* Dashboard routes */}
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/caretaker-dashboard" element={<CaretakerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;