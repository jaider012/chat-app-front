import React from 'react';
import ChatWindow from '../components/ChatWindow';
import { mockConversations, mockMessages, mockUser } from '../utils/mockData';

const DebugChatPage: React.FC = () => {
  const handleSendMessage = (content: string) => {
    console.log('Send message:', content);
  };

  const handleStartTyping = () => {
    console.log('Start typing');
  };

  const handleStopTyping = () => {
    console.log('Stop typing');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug Chat Window</h1>
        
        <div className="bg-white rounded-lg shadow-lg" style={{ height: '600px' }}>
          <ChatWindow
            conversation={mockConversations[0]}
            messages={mockMessages}
            onSendMessage={handleSendMessage}
            onStartTyping={handleStartTyping}
            onStopTyping={handleStopTyping}
            isTyping={false}
            currentUser={mockUser}
          />
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ 
              conversation: mockConversations[0], 
              messages: mockMessages, 
              user: mockUser 
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugChatPage;