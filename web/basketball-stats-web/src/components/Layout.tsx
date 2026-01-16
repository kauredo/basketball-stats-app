import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Statistics', href: '/statistics', icon: ChartBarIcon },
  { name: 'Games', href: '/games', icon: TrophyIcon },
  { name: 'Teams', href: '/teams', icon: UserGroupIcon },
  { name: 'Players', href: '/players', icon: UsersIcon },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, selectedLeague, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800">
        <div className="flex h-16 shrink-0 items-center px-6">
          <div className="flex items-center">
            <Icon name="basketball" size={24} className="mr-2 text-orange-600" />
            <span className="text-lg font-bold text-white">
              Basketball Stats
            </span>
          </div>
        </div>
        
        {/* League info */}
        {selectedLeague && (
          <div className="px-6 py-3 border-b border-gray-700">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Current League</div>
            <div className="text-sm font-medium text-white mt-1">{selectedLeague.name}</div>
            <div className="text-xs text-gray-400">{selectedLeague.league_type} • {selectedLeague.season}</div>
          </div>
        )}
        <nav className="mt-6">
          <ul role="list" className="flex flex-1 flex-col gap-y-2 px-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                      isActive
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <item.icon
                      className={`h-6 w-6 shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* User menu at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex w-full items-center justify-between rounded-lg p-2 text-left text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-white">
                    {user?.full_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedLeague?.membership?.display_role || 'Member'}
                  </div>
                </div>
              </div>
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </button>
            
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-md bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserIcon className="mr-3 h-5 w-5" />
                  Profile
                </Link>
                <Link
                  to="/leagues"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <TrophyIcon className="mr-3 h-5 w-5" />
                  Switch League
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-gray-800 shadow">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                {selectedLeague?.name || 'Basketball Stats'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                Welcome back, {user?.first_name}!
              </span>
            </div>
          </div>
        </div>
        
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}