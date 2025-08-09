// Layout component utilities and styles
// This provides consistent layout styling across platforms

export interface PageProps {
  variant?: 'default' | 'centered' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const getPageStyles = (props: PageProps = {}) => {
  const {
    variant = 'default',
    padding = 'md',
    maxWidth = 'full'
  } = props;

  const baseClasses = [
    'min-h-screen',
    'bg-gradient-to-br from-dark-950 to-dark-900'
  ].join(' ');

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-12'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-4xl mx-auto',
    xl: 'max-w-6xl mx-auto',
    '2xl': 'max-w-7xl mx-auto',
    full: 'w-full'
  };

  const variantClasses = {
    default: 'flex flex-col',
    centered: 'flex items-center justify-center min-h-screen',
    full: 'h-screen flex flex-col'
  };

  return `${baseClasses} ${paddingClasses[padding]} ${maxWidthClasses[maxWidth]} ${variantClasses[variant]}`;
};

export const getContentStyles = (animated: boolean = true) => {
  return [
    'flex-1',
    animated ? 'animate-fade-in' : ''
  ].filter(Boolean).join(' ');
};

// Header styles
export const getHeaderStyles = () => {
  return 'mb-8 text-center md:text-left';
};

export const getTitleStyles = (size: 'sm' | 'md' | 'lg' | 'xl' = 'lg') => {
  const sizeMap = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl'
  };

  return `${sizeMap[size]} font-bold text-white mb-2`;
};

export const getSubtitleStyles = () => {
  return 'text-gray-400 text-base md:text-lg';
};

// Grid layouts
export const getGridStyles = (cols: number = 1, gap: 'sm' | 'md' | 'lg' = 'md') => {
  const gapMap = {
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8'
  };

  const colsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return `grid ${colsMap[cols] || 'grid-cols-1'} ${gapMap[gap]}`;
};

// Loading states
export const getLoadingContainerStyles = () => {
  return 'flex items-center justify-center min-h-64';
};

export const getLoadingSpinnerStyles = () => {
  return 'w-8 h-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent';
};

// Basketball themed decorations
export const getBasketballIconStyles = (size: 'sm' | 'md' | 'lg' | 'xl' = 'md', animate: boolean = true) => {
  const sizeMap = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  return [
    sizeMap[size],
    animate ? 'animate-bounce-ball' : '',
    'mb-4'
  ].filter(Boolean).join(' ');
};