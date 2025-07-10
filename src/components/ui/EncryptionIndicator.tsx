import React from 'react';
import { EncryptionStatus } from '../../crypto/types';
import { useEncryption } from '../../hooks/useCrypto';
import { 
  encryptionStatusConfig, 
  encryptionSizeConfig, 
  getEncryptionStatusConfig, 
  getEncryptionSizeConfig 
} from '../../utils/encryptionHelpers';

interface EncryptionIndicatorProps {
  conversationId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}


export const EncryptionIndicator: React.FC<EncryptionIndicatorProps> = ({
  conversationId,
  size = 'md',
  showText = false,
  className = '',
}) => {
  const { status } = useEncryption(conversationId);
  const config = getEncryptionStatusConfig(status);
  const sizes = getEncryptionSizeConfig(size);

  const IconComponent = config.icon;

  if (showText) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-lg border ${config.bgColor} ${sizes.container} ${className}`}
        title={config.description}
      >
        <IconComponent
          className={`${sizes.icon} ${config.color} ${
            status === EncryptionStatus.INITIALIZING ? 'animate-spin' : ''
          }`}
        />
        <span className={`${sizes.text} ${config.color} font-medium`}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full p-2 ${config.bgColor} ${className}`}
      title={config.description}
    >
      <IconComponent
        className={`${sizes.icon} ${config.color} ${
          status === EncryptionStatus.INITIALIZING ? 'animate-spin' : ''
        }`}
      />
    </div>
  );
};

interface EncryptionStatusBadgeProps {
  conversationId: string;
  className?: string;
}

export const EncryptionStatusBadge: React.FC<EncryptionStatusBadgeProps> = ({
  conversationId,
  className = '',
}) => {
  const { status } = useEncryption(conversationId);
  const config = getEncryptionStatusConfig(status);

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
    >
      <config.icon className="w-3 h-3" />
      {config.text}
    </div>
  );
};

interface EncryptionTooltipProps {
  conversationId: string;
  children: React.ReactNode;
}

export const EncryptionTooltip: React.FC<EncryptionTooltipProps> = ({
  conversationId,
  children,
}) => {
  const { status, error } = useEncryption(conversationId);
  const config = getEncryptionStatusConfig(status);

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        <div className="flex items-center gap-2">
          <config.icon className="w-4 h-4" />
          <span>{config.description}</span>
        </div>
        {error && (
          <div className="text-red-300 text-xs mt-1">
            Error: {error.message}
          </div>
        )}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></div>
      </div>
    </div>
  );
};

interface EncryptionStatusPanelProps {
  conversationId: string;
  className?: string;
}

export const EncryptionStatusPanel: React.FC<EncryptionStatusPanelProps> = ({
  conversationId,
  className = '',
}) => {
  const { status, error, initiateKeyExchange, clearKeys } = useEncryption(conversationId);
  const config = getEncryptionStatusConfig(status);

  const handleInitiateEncryption = async () => {
    try {
      await initiateKeyExchange();
    } catch (err) {
      console.error('Failed to initiate encryption:', err);
    }
  };

  const handleClearKeys = () => {
    clearKeys();
  };

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <config.icon
            className={`w-5 h-5 ${config.color} ${
              status === EncryptionStatus.INITIALIZING ? 'animate-spin' : ''
            }`}
          />
          <span className={`font-medium ${config.color}`}>{config.text}</span>
        </div>
        
        {status === EncryptionStatus.NOT_INITIALIZED && (
          <button
            onClick={handleInitiateEncryption}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Enable Encryption
          </button>
        )}
        
        {status === EncryptionStatus.ACTIVE && (
          <button
            onClick={handleClearKeys}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear Keys
          </button>
        )}
      </div>
      
      <p className={`text-sm ${config.color} opacity-75`}>
        {config.description}
      </p>
      
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 text-sm">
            <strong>Error:</strong> {error.message}
          </p>
        </div>
      )}
      
      {status === EncryptionStatus.ACTIVE && (
        <div className="mt-3 text-xs text-green-600">
          <p>✓ Messages are end-to-end encrypted</p>
          <p>✓ Forward secrecy enabled</p>
          <p>✓ Keys automatically rotate</p>
        </div>
      )}
    </div>
  );
};

export default EncryptionIndicator;