import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { messageService } from '@/services/message.service';
import { socketService } from '@/lib/socket';
import { Message } from '@/types';
import { Send } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const { chatId } = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setIsLoading(false);
    }

    // Listen for new messages
    const cleanup = socketService.onNewMessage((message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return cleanup;
  }, [chatId]);

  const loadMessages = async () => {
    try {
      const response = await messageService.getMessages({
        chatId,
        limit: 50
      });
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      // Send via socket for real-time
      socketService.sendMessage({
        to: chatId,
        body: newMessage,
        type: 'text'
      });

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
        <p className="text-gray-600">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow mb-4 p-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const fromUser = typeof message.from === 'string' ? null : message.from;
              const isOwn = fromUser?.id === user?.id;

              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md ${isOwn ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-900'} rounded-lg px-4 py-2`}>
                    {!isOwn && fromUser && (
                      <p className="text-xs font-medium mb-1">
                        {fromUser.firstName} {fromUser.lastName}
                      </p>
                    )}
                    <p>{message.body}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-600'}`}>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn btn-primary flex items-center disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
