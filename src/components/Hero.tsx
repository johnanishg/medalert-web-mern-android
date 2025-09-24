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
          <div className="hidden md:block md:w-2/5">
            <div className={`rounded-xl overflow-hidden shadow-xl p-8 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border border-gray-700' 
                : 'bg-white border border-gray-200'
            } backdrop-blur-sm`}>
              <div className="flex items-center mb-4">
                <div className="flex space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className={`ml-4 h-6 w-full rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`h-4 w-full rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                ))}
                <div className={`h-4 w-2/3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                <div className={`h-10 w-full rounded ${theme === 'dark' ? 'bg-orange-700/30' : 'bg-orange-100'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;