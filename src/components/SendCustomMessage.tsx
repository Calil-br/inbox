import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useBotpressClient } from '../hooks/botpressClient';
import toast from 'react-hot-toast';
import { CreateMessageBody } from '@botpress/client/dist/gen';

interface SendCustomMessageProps {
  className?: string;
}

export const SendCustomMessage: React.FC<SendCustomMessageProps> = ({ className }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [userId, setUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { botpressClient } = useBotpressClient();

  const handleSendMessage = async () => {
    if (!conversationId || !userId || !messageText) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsSending(true);

    try {
      const messageBody: CreateMessageBody = {
        conversationId,
        userId,
        payload: { text: messageText },
        type: 'text',
        tags: {},
      };

      const response = await botpressClient?.createMessage(messageBody);

      if (response && response.message) {
        toast.success('Mensagem enviada com sucesso!');
        setMessageText('');
      }
    } catch (error: any) {
      console.error(JSON.stringify(error));
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-500 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiMessageSquare className="text-2xl" />
          Enviar Mensagem Personalizada
        </h2>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          {isMinimized ? <FiChevronDown /> : <FiChevronUp />}
        </button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID da Conversa
                </label>
                <input
                  type="text"
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-full
                    focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
                    outline-none transition-all duration-200"
                  placeholder="Digite o ID da conversa..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID do Usuário
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-full
                    focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
                    outline-none transition-all duration-200"
                  placeholder="Digite o ID do usuário..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-4 py-2 border rounded-2xl
                    focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
                    outline-none transition-all duration-200 resize-none"
                  placeholder="Digite sua mensagem..."
                  rows={3}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={isSending}
                className={`w-full px-4 py-2 text-white rounded-full
                  ${isSending 
                    ? 'bg-purple-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-900 to-purple-500 hover:opacity-90'
                  } transition-all duration-200`}
              >
                {isSending ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};