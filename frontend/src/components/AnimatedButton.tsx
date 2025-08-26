import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ElementType;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'ghost';
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg',
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  icon: Icon,
  size = 'md',
  children,
  className = '',
  variant = 'primary',
  ...props
}) => (
  <motion.button
    whileHover={{ scale: 1.045, boxShadow: '0 4px 24px #2563eb33' }}
    whileTap={{ scale: 0.98 }}
    className={`
      flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500/40
      ${sizeClasses[size]}
      ${variant === 'primary'
        ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg glassy border border-blue-700/30 hover:from-blue-600 hover:to-blue-400'
        : 'bg-transparent text-blue-300 border border-blue-700/30 hover:bg-blue-900/20'}
      ${props.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110'}
      ${className}
    `}
    {...props}
  >
    {Icon && <Icon className="w-5 h-5" />}
    {children}
  </motion.button>
);
