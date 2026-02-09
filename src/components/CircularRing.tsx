import React, { useEffect, useRef, useState } from 'react';

interface CircularRingProps {
  value: number;
  label: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const CircularRing: React.FC<CircularRingProps> = ({ value, label, color, size = 120, strokeWidth = 10 }) => {
  const prevValueRef = useRef(value);
  const [isAnimating, setIsAnimating] = useState(false);

  const radius = size / 2;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  useEffect(() => {
    const diff = Math.abs(value - prevValueRef.current);
    if (diff >= 3) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <div className="flex flex-col items-center group">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Soft Pearlescent Shadow */}
        <div
          className="absolute inset-4 rounded-full blur-[25px] opacity-10 transition-opacity group-hover:opacity-20"
          style={{ backgroundColor: color }}
        />

        <svg height={size} width={size} className="relative transform -rotate-90 overflow-visible transition-all duration-700 ease-out group-hover:scale-105">
          {/* Backdrop Track - Pearlescent Gray */}
          <circle
            stroke="#F1F5F9"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />

          {/* Glossy Progress Ring */}
          <circle
            stroke={color}
            fill="transparent"
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
              filter: isAnimating ? `drop-shadow(0 0 10px ${color}88)` : `drop-shadow(0 0 4px ${color}22)`
            }}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={size / 2}
            cy={size / 2}
          />

          {/* Liquid Tip - White Glow */}
          <circle
            cx={size / 2 + normalizedRadius * Math.cos((value / 100 * 2 * Math.PI) - Math.PI / 2)}
            cy={size / 2 + normalizedRadius * Math.sin((value / 100 * 2 * Math.PI) - Math.PI / 2)}
            r={strokeWidth / 2.5}
            fill="white"
            className="transition-all duration-[2s] cubic-bezier(0.16, 1, 0.3, 1) shadow-xl"
            style={{ opacity: value > 5 ? 1 : 0 }}
          />
        </svg>

        {/* Elite Value Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline mb-[-4px]">
            <span className={`text-4xl font-serif italic font-bold tracking-tighter transition-all duration-700 ${isAnimating ? 'text-luxe-orange scale-110' : 'text-luxe-deep/80'}`}>
              {Math.round(value)}
            </span>
            <span className="text-[10px] font-black opacity-10 uppercase tracking-widest ml-0.5">%</span>
          </div>
        </div>
      </div>

      {/* Refined Label Strip */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <span className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 ${isAnimating ? 'text-luxe-orange' : 'text-luxe-deep opacity-20'}`}>
          {label}
        </span>
        <div className={`h-1 rounded-full bg-luxe-orange transition-all duration-[1.5s] ease-out ${isAnimating ? 'w-10 opacity-100' : 'w-4 opacity-5'}`}></div>
      </div>
    </div>
  );
};

export default CircularRing;
