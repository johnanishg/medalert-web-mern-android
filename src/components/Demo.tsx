import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

const Demo: React.FC = () => {
  const { theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: 'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      title: 'Voice Interaction Demo',
      description: 'See how users can interact with the system using voice commands.'
    },
    {
      image: 'https://images.pexels.com/photos/8942947/pexels-photo-8942947.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      title: 'Pill Recognition',
      description: 'Our advanced computer vision can identify different types of medication.'
    },
    {
      image: 'https://images.pexels.com/photos/8439093/pexels-photo-8439093.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      title: 'Family Notifications',
      description: 'Family members receive instant alerts when medication is missed.'
    }
  ];
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <section 
      id="demo" 
      className={`py-16 md:py-24 px-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Demo</h2>
          <p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            See our AI-based Medicine Alert System in action with these demonstrations.
          </p>
        </div>
        
        <div className="relative">
          <div className={`relative overflow-hidden rounded-lg shadow-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="relative aspect-w-16 aspect-h-9 group">
              <div className="w-full h-0 pb-[56.25%] relative">
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity group-hover:bg-opacity-30 flex items-center justify-center">
                  <button 
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform transform group-hover:scale-110 ${
                      theme === 'dark' ? 'bg-orange-600 text-white' : 'bg-orange-600 text-white'
                    }`}
                    aria-label="Play demo"
                  >
                    <Play size={24} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{slides[currentSlide].title}</h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {slides[currentSlide].description}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center mt-4 space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  currentSlide === index
                    ? theme === 'dark' ? 'bg-orange-500' : 'bg-orange-600'
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                } transition-colors`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={prevSlide}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-gray-800/80 text-white hover:bg-gray-700/80'
                : 'bg-white/80 text-gray-800 hover:bg-gray-100/80'
            } backdrop-blur-sm focus:outline-none transition-colors`}
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={nextSlide}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-gray-800/80 text-white hover:bg-gray-700/80'
                : 'bg-white/80 text-gray-800 hover:bg-gray-100/80'
            } backdrop-blur-sm focus:outline-none transition-colors`}
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Demo;