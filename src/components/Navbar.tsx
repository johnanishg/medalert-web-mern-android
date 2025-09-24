import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/TranslationContext';
import { Pill, Menu, X, Moon, Sun } from 'lucide-react';
import Login from './Login';
import Register from './Register';
import AdminLogin from './AdminLogin';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, translateText, translatePage } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);

  const [tHome, setTHome] = useState('Home');
  const [tFeatures, setTFeatures] = useState('Features');
  const [tHardware, setTHardware] = useState('Hardware');
  const [tDemo, setTDemo] = useState('Demo');
  const [tTeam, setTTeam] = useState('Team');
  const [tLogin, setTLogin] = useState('Login');
  const [tRegister, setTRegister] = useState('Register');
  const [tLightMode, setTLightMode] = useState('Light Mode');
  const [tDarkMode, setTDarkMode] = useState('Dark Mode');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Secret key combination for admin access (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdminLogin(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Translate labels when language changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [home, features, hardware, demo, team, login, register, light, dark] = await Promise.all([
          translateText('Home'),
          translateText('Features'),
          translateText('Hardware'),
          translateText('Demo'),
          translateText('Team'),
          translateText('Login'),
          translateText('Register'),
          translateText('Light Mode'),
          translateText('Dark Mode'),
        ]);
        if (cancelled) return;
        setTHome(home);
        setTFeatures(features);
        setTHardware(hardware);
        setTDemo(demo);
        setTTeam(team);
        setTLogin(login);
        setTRegister(register);
        setTLightMode(light);
        setTDarkMode(dark);
        if (translatePage) {
          // fire-and-forget page translation
          translatePage();
        }
      } catch (e) {
        // On failure, keep English defaults
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [language, translateText, translatePage]);

  const navLinks = [
    { name: tHome, href: '#home' },
    { name: tFeatures, href: '#features' },
    { name: tHardware, href: '#hardware' },
    { name: tDemo, href: '#demo' },
    { name: tTeam, href: '#team' },
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? theme === 'dark' 
            ? 'bg-gray-900/95 shadow-md backdrop-blur-sm' 
            : 'bg-white/95 shadow-md backdrop-blur-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="#home" className="flex items-center text-primary-500 hover:text-primary-400 transition-colors">
              <Pill className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">MedAlert</span>
            </a>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  } transition-colors`}
                >
                  {link.name}
                </a>
              ))}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className={`px-2 py-2 rounded-md text-sm font-medium border ${
                  theme === 'dark'
                    ? 'bg-gray-900 text-gray-300 border-gray-700'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                aria-label="Change language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                {tLogin}
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                {tRegister}
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                } transition-colors`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              } transition-colors`}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              } transition-colors`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <button
            onClick={() => {
              setShowLogin(true);
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            {tLogin}
          </button>
          <button
            onClick={() => {
              setShowRegister(true);
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors"
          >
            {tRegister}
          </button>
          <button
            onClick={toggleTheme}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            } transition-colors flex items-center`}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={20} className="mr-2" /> {tLightMode}
              </>
            ) : (
              <>
                <Moon size={20} className="mr-2" /> {tDarkMode}
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Login Modal */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      
      {/* Register Modal */}
      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin
          onClose={() => setShowAdminLogin(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;