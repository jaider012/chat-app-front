import React, { useState, useRef, useEffect } from "react";
import { Send, Shield } from "lucide-react";
import type { ChatWindowProps } from "../types";
import { getUserDisplayName, formatMessageTime } from "../utils/dataHelpers";
import { EncryptionIndicator, EncryptionStatusPanel } from "./ui/EncryptionIndicator";
import { useEncryption } from "../hooks/useCrypto";
import { useSocket } from "../contexts/SocketContext";
import { EncryptionStatus } from "../crypto/types";

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  isTyping,
  currentUser,
}) => {
  console.log("ChatWindow rendered with:", {
    conversation,
    messages,
    currentUser,
  });
  const [messageInput, setMessageInput] = useState("");
  const [, setIsInputFocused] = useState(false);
  const [showEncryptionPanel, setShowEncryptionPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { initiateKeyExchange } = useSocket();
  const { status: encryptionStatus, isSecure } = useEncryption(conversation?.id || '');

  const otherParticipant = conversation?.participants?.find(
    (p) => p.id !== currentUser?.id
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (messageInput.trim() && onSendMessage) {
        onSendMessage(messageInput.trim());
        setMessageInput("");
        handleStopTyping();
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (e.target.value.trim() && onStartTyping) {
      onStartTyping();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 1000);
    } else if (!e.target.value.trim()) {
      handleStopTyping();
    }
  };

  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (onStopTyping) {
      onStopTyping();
    }
  };

  const handleSetupEncryption = async () => {
    if (!conversation?.id) return;
    
    try {
      await initiateKeyExchange(conversation.id);
    } catch (error) {
      console.error('Failed to setup encryption:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Verify that we have the necessary data
  if (!conversation || !currentUser) {
    console.error("ChatWindow: Missing required props", {
      conversation,
      currentUser,
    });
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-500">Missing conversation or user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="hidden lg:flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
              {getUserDisplayName(otherParticipant)[0]?.toUpperCase() || "U"}
            </div>
            {otherParticipant?.isOnline && (
              <div className="absolute bottom-0 right-0 status-online ring-2 ring-white"></div>
            )}
          </div>
          <div>
            <h2 className="font-medium text-gray-900">
              {getUserDisplayName(otherParticipant)}
            </h2>
            <p className="text-sm text-gray-500">
              {otherParticipant?.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <EncryptionIndicator 
            conversationId={conversation.id} 
            showText={true}
            size="sm"
          />
          <button
            onClick={() => setShowEncryptionPanel(!showEncryptionPanel)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Encryption settings"
          >
            <Shield className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showEncryptionPanel && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="p-4">
            <EncryptionStatusPanel 
              conversationId={conversation.id}
              className="bg-white"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages && messages.length > 0 ? (
          messages.map((message) => {
            if (!message || !message.id) return null;

            const isOwnMessage =
              (message.senderId || message.sender?.id) === currentUser.id;

            return (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                } animate-slide-up`}
              >
                <div className="max-w-[85%] sm:max-w-sm md:max-w-md lg:max-w-lg">
                  <div
                    className={`${
                      isOwnMessage ? "chat-bubble-sent" : "chat-bubble-received"
                    } rounded-2xl px-4 py-2 break-words relative`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {isSecure && (
                      <div className="absolute top-1 right-1">
                        <EncryptionIndicator 
                          conversationId={conversation.id}
                          size="sm"
                          className="w-4 h-4 opacity-60"
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-xs text-gray-500 mt-1 ${
                      isOwnMessage ? "text-right" : "text-left"
                    }`}
                  >
                    {message.timestamp || message.createdAt
                      ? formatMessageTime(
                          message.timestamp || message.createdAt || ""
                        )
                      : "Just now"}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet</p>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start animate-slide-up">
            <div className="max-w-[85%] sm:max-w-sm md:max-w-md lg:max-w-lg">
              <div className="chat-bubble-received rounded-2xl px-4 py-2">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 bg-white flex-shrink-0"
      >
        {encryptionStatus === EncryptionStatus.NOT_INITIALIZED && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Enable end-to-end encryption for secure messaging
                </span>
              </div>
              <button
                type="button"
                onClick={handleSetupEncryption}
                className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                setIsInputFocused(false);
                handleStopTyping();
              }}
              placeholder={isSecure ? "Type an encrypted message..." : "Type a message..."}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent max-h-32 text-sm sm:text-base pr-10"
              rows={1}
              style={{ minHeight: "44px" }}
            />
            {isSecure && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <EncryptionIndicator 
                  conversationId={conversation.id}
                  size="sm"
                  className="opacity-60"
                />
              </div>
            )}
          </div>
          <div className="flex justify-center h-full">
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className={`p-2 sm:p-3 rounded-lg transition-colors ${
                messageInput.trim()
                  ? "bg-secondary text-white hover:bg-secondary/90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
