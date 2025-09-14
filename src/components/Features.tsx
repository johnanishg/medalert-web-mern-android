import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Volume2, Bell, Utensils, Camera, Users } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`p-6 rounded-lg transition-all duration-300 transform hover:-translate-y-1 ${
        theme === 'dark'
          ? 'bg-gray-800/60 border border-gray-700 hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(255,77,0,0.15)]'
          : 'bg-white border border-gray-200 hover:border-orange-500/50 hover:shadow-lg'
      }`}
    >
      <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${
        theme === 'dark' ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-600'
      }`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
    </div>
  );
};

const Features: React.FC = () => {
  const { theme } = useTheme();
  
  const features = [
    {
      icon: <Volume2 size={24} />,
      title: 'Voice + Button Control',
      description: 'Intuitive voice commands and physical buttons for easy interaction with the device.'
    },
    {
      icon: <Bell size={24} />,
      title: 'Native Language Alerts',
      description: 'Personalized reminders in the user\'s native language for better comprehension.'
    },
    {
      icon: <Utensils size={24} />,
      title: 'Meal-time Smart Scheduling',
      description: 'Intelligent scheduling system that reminds users to take medication with meals.'
    },
    {
      icon: <Camera size={24} />,
      title: 'Pill Strip Identification',
      description: 'Camera-based system that identifies pills using computer vision technology.'
    },
    {
      icon: <Users size={24} />,
      title: 'Family Notification System',
      description: 'Automatic alerts to family members when medication is missed or taken.'
    }
  ];

  return (
    <section 
      id="features" 
      className={`py-16 md:py-24 px-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
          <p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Our AI-based medicine alert system comes with a range of features designed to improve medication adherence and safety.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;