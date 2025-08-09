// Card component utilities and styles
// This provides consistent card styling across platforms

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

export const getCardStyles = (props: CardProps = {}) => {
  const {
    variant = 'default',
    padding = 'md',
    hover = false,
    interactive = false
  } = props;

  const baseClasses = [
    'rounded-lg transition-all duration-200',
    interactive ? 'cursor-pointer' : '',
    hover ? 'hover:shadow-lg hover:-translate-y-1' : ''
  ].filter(Boolean).join(' ');

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const variantClasses = {
    default: [
      'bg-white dark:bg-dark-800',
      'border border-gray-200 dark:border-dark-700',
      'shadow-sm'
    ].join(' '),
    
    elevated: [
      'bg-white dark:bg-dark-800',
      'shadow-md hover:shadow-lg'
    ].join(' '),
    
    outlined: [
      'bg-transparent',
      'border border-gray-300 dark:border-dark-600'
    ].join(' '),
    
    glass: [
      'bg-white/10 dark:bg-dark-800/20',
      'backdrop-blur-md',
      'border border-white/20 dark:border-dark-700/30'
    ].join(' ')
  };

  return `${baseClasses} ${paddingClasses[padding]} ${variantClasses[variant]}`;
};

// Stat card specific styling
export const getStatCardStyles = (highlighted: boolean = false) => {
  return [
    getCardStyles({ variant: 'default', padding: 'lg', hover: true }),
    'text-center',
    highlighted ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''
  ].filter(Boolean).join(' ');
};

export const getStatValueStyles = (color: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' = 'primary') => {
  const colorMap = {
    primary: 'text-primary-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    neutral: 'text-gray-900 dark:text-white'
  };

  return `text-3xl font-bold mb-2 ${colorMap[color]}`;
};

export const getStatLabelStyles = () => {
  return 'text-sm text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide';
};