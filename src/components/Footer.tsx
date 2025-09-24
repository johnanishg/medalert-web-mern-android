import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Trans from './common/Trans';
import { Github, Mail, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <footer className={`py-12 px-4 ${
      theme === 'dark' ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-50 border-t border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4"><Trans>AI-Based Medicine Alert System</Trans></h3>
            <Trans as="p" className={`mb-4 max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Our innovative system helps patients manage their medication schedule with AI-powered reminders and verification.
            </Trans>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                }`}
                aria-label="GitHub repository"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:contact@medalert.io"
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                }`}
                aria-label="Contact email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-base font-semibold mb-4"><Trans>Quick Links</Trans></h4>
            <ul className={`space-y-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>
                <a href="#home" className="hover:underline"><Trans>Home</Trans></a>
              </li>
              <li>
                <a href="#features" className="hover:underline"><Trans>Features</Trans></a>
              </li>
              <li>
                <a href="#hardware" className="hover:underline"><Trans>Hardware</Trans></a>
              </li>
              <li>
                <a href="#demo" className="hover:underline"><Trans>Demo</Trans></a>
              </li>
              <li>
                <a href="#team" className="hover:underline"><Trans>Team</Trans></a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-base font-semibold mb-4"><Trans>Legal</Trans></h4>
            <ul className={`space-y-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>
                <a href="#" className="flex items-center hover:underline">
                  <Shield size={16} className="mr-2" />
                  <Trans>Privacy Policy</Trans>
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline"><Trans>Terms of Service</Trans></a>
              </li>
              <li>
                <a href="#" className="hover:underline"><Trans>Cookie Policy</Trans></a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={`mt-8 pt-8 ${theme === 'dark' ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}>
          <Trans as="p" className={`text-sm text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
            © {new Date().getFullYear()} MedAlert System. All rights reserved.
          </Trans>
        </div>
      </div>
    </footer>
  );
};

export default Footer;