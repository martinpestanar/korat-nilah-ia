import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-10 w-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Rhombus Container (Diamond) */}
      <path 
        d="M50 0L100 50L50 100L0 50L50 0Z" 
        fill="#34D399" 
        className="text-primary"
      />
      
      {/* Stylized Leaf (Negative Space using Dark Color) */}
      <path 
        d="M50 20C50 20 70 35 70 55C70 68.8071 58.8071 80 45 80C45 80 52 65 52 50C52 35 30 35 30 35C30 35 38 20 50 20Z" 
        fill="#121212" 
        stroke="#121212"
        strokeWidth="2"
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Optional: Small Tech Accent Line */}
      <circle cx="50" cy="88" r="3" fill="#121212" />
    </svg>
  );
};

export default Logo;