import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, ThemeMode } from "../contexts/ThemeContext";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  TableCellsIcon,
  ArrowsRightLeftIcon,
  MapPinIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/app", icon: HomeIcon },
  { name: "Standings", href: "/app/standings", icon: TableCellsIcon },
  { name: "Statistics", href: "/app/statistics", icon: ChartBarIcon },
  { name: "Shot Charts", href: "/app/shot-charts", icon: MapPinIcon },
  { name: "Compare", href: "/app/compare", icon: ArrowsRightLeftIcon },
  { name: "Games", href: "/app/games", icon: TrophyIcon },
  { name: "Teams", href: "/app/teams", icon: UserGroupIcon },
  { name: "Players", href: "/app/players", icon: UsersIcon },
];

const themeOptions: { mode: ThemeMode; icon: typeof SunIcon; label: string }[] = [
  { mode: "light", icon: SunIcon, label: "Light" },
  { mode: "system", icon: ComputerDesktopIcon, label: "System" },
  { mode: "dark", icon: MoonIcon, label: "Dark" },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, selectedLeague, logout } = useAuth();
  const { mode, resolvedTheme, setMode } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const menuItems = [
    { id: "profile", label: "Profile" },
    { id: "leagues", label: "Switch League" },
    { id: "logout", label: "Sign out" },
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setSidebarOpen(false);
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle keyboard navigation in menu
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showUserMenu) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % menuItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
          break;
        case "Escape":
          e.preventDefault();
          setShowUserMenu(false);
          menuButtonRef.current?.focus();
          break;
        case "Tab":
          setShowUserMenu(false);
          break;
      }
    },
    [showUserMenu, menuItems.length]
  );

  // Focus the menu item when focusedIndex changes
  useEffect(() => {
    if (showUserMenu && focusedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[focusedIndex]?.focus();
    }
  }, [focusedIndex, showUserMenu]);

  // Reset focused index when menu closes
  useEffect(() => {
    if (!showUserMenu) {
      setFocusedIndex(-1);
    }
  }, [showUserMenu]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  // Sidebar content - shared between mobile and desktop
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="flex h-16 shrink-0 items-center px-6">
        <Logo variant={resolvedTheme === "dark" ? "light" : "dark"} size="md" />
      </div>

      {/* League info */}
      {selectedLeague && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Current League
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            {selectedLeague.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {selectedLeague.leagueType} • {selectedLeague.season}
          </div>
        </div>
      )}

      {/* Theme toggle */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-700 p-1" role="group" aria-label="Theme selection">
          {themeOptions.map((option) => (
            <button
              key={option.mode}
              onClick={() => setMode(option.mode)}
              className={`flex-1 flex items-center justify-center rounded-md py-1.5 px-2 transition-colors ${
                mode === option.mode
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              aria-label={`Switch to ${option.label.toLowerCase()} theme`}
              aria-pressed={mode === option.mode}
            >
              <option.icon className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <nav className="mt-4 flex-1">
        <ul role="list" className="flex flex-1 flex-col gap-y-1 px-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onNavClick}
                  className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                    isActive
                      ? "bg-orange-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white"
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="relative">
          <button
            ref={menuButtonRef}
            onClick={() => setShowUserMenu(!showUserMenu)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && !showUserMenu) {
                e.preventDefault();
                setShowUserMenu(true);
                setFocusedIndex(0);
              }
            }}
            className="flex w-full items-center justify-between rounded-lg p-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            aria-controls="user-menu"
          >
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedLeague?.role || "Member"}
                </div>
              </div>
            </div>
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {showUserMenu && (
            <div
              ref={menuRef}
              id="user-menu"
              role="menu"
              aria-label="User menu"
              onKeyDown={handleMenuKeyDown}
              className="absolute bottom-full left-0 right-0 mb-2 rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5"
            >
              <Link
                to="/app/profile"
                role="menuitem"
                tabIndex={focusedIndex === 0 ? 0 : -1}
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none"
                onClick={() => {
                  setShowUserMenu(false);
                  onNavClick?.();
                }}
              >
                <UserIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                Profile
              </Link>
              <Link
                to="/app/leagues"
                role="menuitem"
                tabIndex={focusedIndex === 1 ? 0 : -1}
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none"
                onClick={() => {
                  setShowUserMenu(false);
                  onNavClick?.();
                }}
              >
                <TrophyIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                Switch League
              </Link>
              <button
                role="menuitem"
                tabIndex={focusedIndex === 2 ? 0 : -1}
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-orange-600 focus:text-white focus:rounded-lg focus:font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Close navigation menu"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Hamburger menu button - visible on mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {selectedLeague?.name || "Basketball Stats"}
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">
                Welcome back, {user?.firstName}!
              </span>
              <NotificationBell />
            </div>
          </div>
        </div>

        <main id="main-content" className="py-6" tabIndex={-1}>
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowUserMenu(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
