import React from 'react';
import { Logo } from './Logo';
import { User as UserType } from '../types';

interface HeaderProps {
  user: UserType;
}

export const Header: React.FC<HeaderProps> = ({ user }) => (
  <header className="w-full glassy flex items-center justify-between px-8 py-4 mb-2 border-b border-blue-900/30 shadow-lg">
    <div className="flex items-center space-x-4">
      <Logo size={44} />
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-600 to-blue-300 bg-clip-text text-transparent tracking-tight select-none">
        Bolt Legal AI
      </span>
    </div>
    <div className="flex items-center space-x-3">
      {user.avatar_url && (
        <img src={user.avatar_url} alt="avatar" className="w-9 h-9 rounded-full border-2 border-blue-500 shadow" />
      )}
      <span className="text-white font-medium text-lg">{user.name}</span>
    </div>
  </header>
);
