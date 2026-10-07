import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export default function PondokLogo({ className = "w-8 h-8", size }: LogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div 
      className={`bg-white text-sky-850 rounded-xl flex items-center justify-center font-black select-none shadow-xs shrink-0 ${className}`} 
      style={style}
    >
      <span className="leading-none text-center">T</span>
    </div>
  );
}
