import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, type ThemeMode } from "../contexts/ThemeContext";
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
  Cog6ToothIcon,
  BuildingOffice2Icon,
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
  { name: "Leagues", href: "/app/leagues", icon: BuildingOffice2Icon },
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
    { id: "league-settings", label: "League Settings" },
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
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-surface-200 dark:border-surface-700">
        <Logo variant={resolvedTheme === "dark" ? "light" : "dark"} size="md" />
      </div>

      {/* League info */}
      {selectedLeague && (
        <div className="px-6 py-4">
          <div className="section-header mb-1">League</div>
          <div className="font-semibold text-surface-900 dark:text-surface-50">
            {selectedLeague.name}
          </div>
          <div className="text-sm text-surface-500 dark:text-surface-400">
            {selectedLeague.leagueType} · {selectedLeague.season}
          </div>
        </div>
      )}

      {/* Theme toggle */}
      <div className="px-6 py-3">
        <div
          className="flex items-center rounded-xl bg-surface-100 dark:bg-surface-800 p-1"
          role="group"
          aria-label="Theme selection"
        >
          {themeOptions.map((option) => (
            <button
              key={option.mode}
              onClick={() => setMode(option.mode)}
              className={`flex-1 flex items-center justify-center rounded-lg py-2 px-3 transition-all duration-200 ${
                mode === option.mode
                  ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-soft"
                  : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300"
              }`}
              aria-label={`Switch to ${option.label.toLowerCase()} theme`}
              aria-pressed={mode === option.mode}
            >
              <option.icon className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul role="list" className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onNavClick}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary-500 text-white shadow-soft"
                      : "text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50"
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300"
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
      <div className="p-4 border-t border-surface-200 dark:border-surface-700">
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
            className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            aria-controls="user-menu"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-soft">
                <span className="text-sm font-semibold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {selectedLeague?.role || "Member"}
                </div>
              </div>
            </div>
            <ChevronDownIcon
              className={`h-4 w-4 text-surface-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
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
              className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-white dark:bg-surface-800 py-1.5 shadow-elevated border border-surface-200 dark:border-surface-700"
            >
              <Link
                to="/app/profile"
                role="menuitem"
                tabIndex={focusedIndex === 0 ? 0 : -1}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-50 focus:bg-surface-100 dark:focus:bg-surface-700 focus:outline-none transition-colors"
                onClick={() => {
                  setShowUserMenu(false);
                  onNavClick?.();
                }}
              >
                <UserIcon className="h-4 w-4 text-surface-400" aria-hidden="true" />
                Profile
              </Link>
              <Link
                to="/app/league-settings"
                role="menuitem"
                tabIndex={focusedIndex === 1 ? 0 : -1}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-50 focus:bg-surface-100 dark:focus:bg-surface-700 focus:outline-none transition-colors"
                onClick={() => {
                  setShowUserMenu(false);
                  onNavClick?.();
                }}
              >
                <Cog6ToothIcon className="h-4 w-4 text-surface-400" aria-hidden="true" />
                League Settings
              </Link>
              <Link
                to="/app/leagues"
                role="menuitem"
                tabIndex={focusedIndex === 2 ? 0 : -1}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-50 focus:bg-surface-100 dark:focus:bg-surface-700 focus:outline-none transition-colors"
                onClick={() => {
                  setShowUserMenu(false);
                  onNavClick?.();
                }}
              >
                <TrophyIcon className="h-4 w-4 text-surface-400" aria-hidden="true" />
                Switch League
              </Link>
              <div className="my-1 border-t border-surface-200 dark:border-surface-700" />
              <button
                role="menuitem"
                tabIndex={focusedIndex === 3 ? 0 : -1}
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-status-active hover:bg-status-active/10 focus:bg-status-active/10 focus:outline-none transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:font-medium focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Close navigation menu"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Hamburger menu button - visible on mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              <h1 className="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-50 truncate">
                {selectedLeague?.name || "Basketball Stats"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-surface-500 dark:text-surface-400">
                {user?.firstName}
              </span>
              <NotificationBell />
            </div>
          </div>
        </header>

        <main id="main-content" className="py-8" tabIndex={-1}>
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl">{children}</div>
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
