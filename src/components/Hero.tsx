import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowRight } from 'lucide-react';
import Trans from './common/Trans';

const Hero: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <section 
      id="home" 
      className={`pt-20 pb-16 md:pt-32 md:pb-24 px-4 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center md:text-left md:flex md:items-center md:justify-between">
          <div className="md:max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="block"><Trans>AI-Based</Trans></span>
              <span className={`block ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                <Trans>Medicine Alert System</Trans>
              </span>
            </h1>
            <Trans as="p" className="mt-6 text-xl max-w-2xl mx-auto md:mx-0 md:text-2xl leading-relaxed text-gray-400">
              Personalized native-language reminders, pill detection & family notifications.
            </Trans>
            <div className="mt-10">
              <a
                href="#demo"
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
                  theme === 'dark'
                    ? 'text-white bg-orange-600 hover:bg-orange-700'
                    : 'text-white bg-orange-600 hover:bg-orange-700'
                } transition-colors duration-300 transform hover:scale-105`}
              >
                <Trans>View Demo</Trans>
                <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="hidden md:block md:w-2/5 flex items-center justify-center">
            <img 
              src="/MedAlert_Logo.png" 
              alt="MedAlert Logo" 
              className="max-w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;