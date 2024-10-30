import React, { useState } from 'react';
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
    <div className={`bg-white rounded-md shadow-md overflow-hidden ${className}`}>
      <div className="p-2 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">Enviar Mensagem Personalizada</h2>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isMinimized ? 'Expandir' : 'Minimizar'}
        </button>
      </div>

      {!isMinimized && (
        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID da Conversa
            </label>
            <input
              type="text"
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              className="w-full p-2 border rounded"
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
              className="w-full p-2 border rounded"
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
              className="w-full p-2 border rounded"
              placeholder="Digite sua mensagem..."
              rows={3}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={isSending}
            className={`w-full p-2 text-white rounded ${
              isSending ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSending ? 'Enviando...' : 'Enviar Mensagem'}
          </button>
        </div>
      )}
    </div>
  );
};