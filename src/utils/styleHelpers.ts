/**
 * Size classes for icons and UI elements
 */
export const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
} as const;

/**
 * Button size classes for padding
 */
export const buttonSizeClasses = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
  xl: 'p-4'
} as const;

/**
 * Text size classes
 */
export const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
} as const;

/**
 * Avatar size classes
 */
export const avatarSizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
} as const;

/**
 * Gets class name from size config
 */
export const getSizeClass = (
  config: Record<string, string>,
  size: string,
  fallback: string = ''
) => {
  return config[size] || fallback;
};

export type Size = keyof typeof sizeClasses;