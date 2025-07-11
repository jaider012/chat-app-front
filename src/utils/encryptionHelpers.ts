import { Shield, ShieldCheck, ShieldX, ShieldAlert, Loader2 } from 'lucide-react';
import { EncryptionStatus } from '../crypto/types';

/**
 * Configuration for encryption status display
 */
export const encryptionStatusConfig = {
  [EncryptionStatus.NOT_INITIALIZED]: {
    icon: Shield,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    text: 'Not encrypted',
    description: 'Messages are not encrypted',
  },
  [EncryptionStatus.INITIALIZING]: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    text: 'Initializing...',
    description: 'Setting up encryption',
  },
  [EncryptionStatus.KEY_EXCHANGE_PENDING]: {
    icon: ShieldAlert,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    text: 'Key exchange pending',
    description: 'Waiting for encryption setup',
  },
  [EncryptionStatus.ACTIVE]: {
    icon: ShieldCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    text: 'Encrypted',
    description: 'End-to-end encrypted',
  },
  [EncryptionStatus.ERROR]: {
    icon: ShieldX,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    text: 'Error',
    description: 'Encryption error',
  },
};

/**
 * Size configuration for encryption indicators
 */
export const encryptionSizeConfig = {
  sm: {
    icon: 'w-4 h-4',
    container: 'px-2 py-1 text-xs',
    text: 'text-xs',
  },
  md: {
    icon: 'w-5 h-5',
    container: 'px-3 py-2 text-sm',
    text: 'text-sm',
  },
  lg: {
    icon: 'w-6 h-6',
    container: 'px-4 py-3 text-base',
    text: 'text-base',
  },
};

/**
 * Gets encryption status configuration
 */
export const getEncryptionStatusConfig = (status: EncryptionStatus) => {
  return encryptionStatusConfig[status];
};

/**
 * Gets encryption size configuration
 */
export const getEncryptionSizeConfig = (size: keyof typeof encryptionSizeConfig) => {
  return encryptionSizeConfig[size];
};

/**
 * Checks if encryption status indicates a secure state
 */
export const isEncryptionSecure = (status: EncryptionStatus): boolean => {
  return status === EncryptionStatus.ACTIVE;
};

/**
 * Checks if encryption status indicates a loading state
 */
export const isEncryptionLoading = (status: EncryptionStatus): boolean => {
  return status === EncryptionStatus.INITIALIZING || 
         status === EncryptionStatus.KEY_EXCHANGE_PENDING;
};

/**
 * Checks if encryption status indicates an error state
 */
export const isEncryptionError = (status: EncryptionStatus): boolean => {
  return status === EncryptionStatus.ERROR;
};

/**
 * Gets user-friendly encryption status message
 */
export const getEncryptionStatusMessage = (status: EncryptionStatus): string => {
  const config = encryptionStatusConfig[status];
  return config.description;
};