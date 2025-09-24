import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Smartphone, Mic, Camera, Wifi, Speaker, Battery, Monitor, Server } from 'lucide-react';
import Trans from './common/Trans';

interface HardwareItemProps {
  icon: React.ReactNode;
  name: string;
  description: string;
}

const HardwareItem: React.FC<HardwareItemProps> = ({ icon, name, description }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`flex items-start p-4 rounded-lg ${
      theme === 'dark'
        ? 'bg-gray-800/60 border border-gray-700'
        : 'bg-white border border-gray-200'
    }`}>
      <div className={`flex-shrink-0 mr-4 w-10 h-10 flex items-center justify-center rounded-full ${
        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
      }`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-medium mb-1"><Trans>{name}</Trans></h3>
        <Trans as="p" className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </Trans>
      </div>
    </div>
  );
};

const Hardware: React.FC = () => {
  const { theme } = useTheme();
  const [hardwareType, setHardwareType] = useState<'essential' | 'advanced'>('essential');
  
  const essentialHardware = [
    {
      icon: <Smartphone size={20} />,
      name: 'Android 7',
      description: 'Mobile computing platform with optimized performance for healthcare applications'
    },
    {
      icon: <Mic size={20} />,
      name: 'Microphone Array',
      description: 'Multi-directional mic for accurate voice command detection'
    },
    {
      icon: <Camera size={20} />,
      name: 'High-Resolution Camera',
      description: 'Advanced camera system for pill identification and verification'
    },
    {
      icon: <Speaker size={20} />,
      name: 'Speaker Module',
      description: 'High-quality speaker for clear voice alerts'
    }
  ];
  
  const advancedHardware = [
    {
      icon: <Wifi size={20} />,
      name: 'Wi-Fi Module',
      description: 'Dual-band connectivity for reliable network communication'
    },
    {
      icon: <Battery size={20} />,
      name: 'Battery Backup',
      description: 'Uninterruptible power supply for emergency situations'
    },
    {
      icon: <Monitor size={20} />,
      name: 'Touch Display',
      description: '7" capacitive touch screen for visual feedback and interaction'
    },
    {
      icon: <Server size={20} />,
      name: 'Edge AI Module',
      description: 'Neural Compute Engine for on-device AI processing'
    }
  ];
  
  const currentHardware = hardwareType === 'essential' ? essentialHardware : advancedHardware;

  return (
    <section 
      id="hardware" 
      className={`py-16 md:py-24 px-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4"><Trans>Hardware</Trans></h2>
          <Trans as="p" className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Our system utilizes state-of-the-art hardware components to ensure reliability and performance.
          </Trans>
          
          <div className="inline-flex mt-6 p-1 rounded-md bg-opacity-20 bg-orange-500">
            <button
              onClick={() => setHardwareType('essential')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                hardwareType === 'essential'
                  ? theme === 'dark' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-orange-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Trans>Essential</Trans>
            </button>
            <button
              onClick={() => setHardwareType('advanced')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                hardwareType === 'advanced'
                  ? theme === 'dark' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-orange-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Trans>Advanced</Trans>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentHardware.map((item, index) => (
            <HardwareItem
              key={index}
              icon={item.icon}
              name={item.name}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hardware;