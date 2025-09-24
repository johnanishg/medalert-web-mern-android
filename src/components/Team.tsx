import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Github, Linkedin } from 'lucide-react';
import Trans from './common/Trans';
import JohnImage from './images/John.jpg';
import PrajwalaImage from './images/Prajwala.jpeg';
import DrushyaImage from './images/Drushya.png';

interface TeamMemberProps {
  name: string;
  role: string;
  image: string;
  github: string;
  linkedin: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, image, github, linkedin }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="relative w-full h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
          style={{ objectPosition: 'center 30%' }}
          onError={() => {
            console.log('Image failed to load:', image, 'for', name);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', image, 'for', name);
          }}
        />
      </div>
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold mb-2"><Trans>{name}</Trans></h3>
        <Trans as="p" className={`text-sm mb-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {role}
        </Trans>
        <div className="flex space-x-3 justify-center">
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
            }`}
            aria-label={`${name}'s GitHub profile`}
          >
            <Github size={20} />
          </a>
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
            }`}
            aria-label={`${name}'s LinkedIn profile`}
          >
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </div>
  );
};

const Team: React.FC = () => {
  const { theme } = useTheme();
  
  const teamMembers = [
    {
      name: 'John Anish G',
      role: 'Developer and AI Engineer',
      image: JohnImage,
      github: 'https://github.com/johnanishg',
      linkedin: 'https://linkedin.com/in/johnanishg'
    },
    {
      name: 'Prajwala U',
      role: 'Developer and AI Engineer',
      image: PrajwalaImage,
      github: 'https://github.com/Prajwala-U',
      linkedin: 'https://linkedin.com/in/prajwala-uday-shetty'
    },
    {
      name: 'Drushya K B',
      role: 'Developer and AI Engineer',
      image: DrushyaImage,
      github: 'https://github.com/Drushya21KB',
      linkedin: 'https://linkedin.com/in/drushya-kb-6478492a4'
    }
  ];

  return (
    <section 
      id="team" 
      className={`py-16 md:py-24 px-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4"><Trans>Team</Trans></h2>
          <Trans as="p" className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Meet our talented team of researchers and developers behind the AI-Based Medicine Alert System.
          </Trans>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <TeamMember
              key={index}
              name={member.name}
              role={member.role}
              image={member.image}
              github={member.github}
              linkedin={member.linkedin}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;