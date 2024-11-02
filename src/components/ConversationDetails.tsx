import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import pRetry, { AbortError } from 'p-retry';
import toast from 'react-hot-toast';
import { Conversation, Message, User } from '@botpress/client';
import { LoadingAnimation } from './interface/Loading';
import { MessageList } from './MessageList';
import { useBotpressClient } from '../hooks/botpressClient';
import { isDefinedAndHasItems } from '../utils/arrayUtils';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiTrash2, FiRefreshCw, FiSend } from 'react-icons/fi';

interface ConversationDetailsProps {
  conversation: Conversation & { userId?: string };
  onDeleteConversation: (conversationId: string) => void;
  messagesInfo?: {
    list: Message[];
    nextToken?: string;
  };
  className?: string;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  onDeleteConversation,
  messagesInfo,
  className,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [nextMessagesToken, setNextMessagesToken] = useState<string>();
  const lastMessageId = useRef<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [, setIsLoadingUsers] = useState(false);

  const { botpressClient } = useBotpressClient();
  const [botpressBotIdAsAUser, setBotpressBotIdAsAUser] = useState<string>();

  const messageListEndRef = useRef<HTMLDivElement>(null);

  // Novo hook useScrollPosition

  // Efeito para buscar novas mensagens periodicamente
  useEffect(() => {
    if (!botpressClient) return;

    const fetchNewMessages = async () => {
      try {
        const messageContainer = messageListRef.current;
        if (!messageContainer) return;

        const getMessages = await botpressClient.listMessages({
          conversationId: conversation.id,
        });

        // Verifica se há novas mensagens
        if (getMessages.messages[0]?.id === lastMessageId.current) {
          return;
        }

        // Atualiza o ID da última mensagem
        lastMessageId.current = getMessages.messages[0]?.id || null;

        // Ordena as mensagens por data
        const sortedNewMessages = getMessages.messages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages((prevMessages) => {
          // Filtra mensagens que já não existem
          const uniqueMessages = sortedNewMessages.filter(
            (newMsg) => !prevMessages.some((prevMsg) => prevMsg.id === newMsg.id)
          );
          
          // Combina as mensagens antigas com as novas
          return [...prevMessages, ...uniqueMessages];
        });

        // Rola para o final se estiver próximo do fim
        const isNearBottom = 
          messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight < 100;
        
        if (isNearBottom) {
          requestAnimationFrame(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          });
        }
      } catch (error: any) {
        console.error('Erro ao buscar novas mensagens:', error);
        if (error.code === 429) return;
      }
    };

    const interval = setInterval(fetchNewMessages, 20000);
    return () => clearInterval(interval);
  }, [botpressClient, conversation.id]);

  // Efeito para ajustar o scroll quando as mensagens mudam
  useLayoutEffect(() => {
    const messageContainer = messageListRef.current;
    if (!messageContainer) return;

    // Salva a posição atual do scroll e a altura total
    const currentScroll = messageContainer.scrollTop;
    const scrollHeight = messageContainer.scrollHeight;

    // Ajusta a posição do scroll após a atualização das mensagens
    requestAnimationFrame(() => {
      if (messageContainer) {
        const newScrollHeight = messageContainer.scrollHeight;
        const scrollDifference = newScrollHeight - scrollHeight;
        messageContainer.scrollTop = currentScroll + scrollDifference;
      }
    });
  }, [messages]);

  // Função para rolar para o final (usada ao enviar mensagens)
  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, []);

  const loadOlderMessages = useCallback(async () => {
    try {
      if (!nextMessagesToken || !botpressClient) {
        return;
      }

      const getMessages = await botpressClient.listMessages({
        conversationId: conversation.id,
        nextToken: nextMessagesToken,
      });

      setMessages((prevMessages) => [...getMessages.messages, ...prevMessages]);

      setNextMessagesToken(getMessages.meta.nextToken || undefined);
    } catch (error: any) {
      console.error("Não foi possível carregar mensagens antigas:", error);
      toast.error("Não foi possível carregar mensagens antigas");
    }
  }, [nextMessagesToken, botpressClient, conversation.id]);

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      if (
        confirm(
          'Tem certeza de que deseja excluir esta conversa?\nTodas as suas mensagens e usuários serão excluídos!'
        )
      ) {
        try {
          const deleteConversation = await botpressClient?.deleteConversation({
            id: conversationId,
          });

          if (deleteConversation) {
            toast.success('Esta conversa foi excluída com sucesso!');
            onDeleteConversation(conversationId);
          }
        } catch (error: any) {
          console.error("Não foi possível excluir esta conversa:", error);
          toast.error('Não foi possível excluir esta conversa');
        }
      }
    },
    [botpressClient, onDeleteConversation]
  );

  useEffect(() => {
    if (!botpressClient) {
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);

      const run = async () => {
        try {
          let messageList: Message[] = [];
          let token: string | undefined;

          const getMessages = await botpressClient.listMessages({
            conversationId: conversation.id,
          });

          // Ordena as mensagens por data (mais antigas primeiro)
          messageList = getMessages.messages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          token = getMessages.meta.nextToken;

          // Atualiza o lastMessageId para o polling
          lastMessageId.current = messageList[messageList.length - 1]?.id || null;

          if (isMounted) {
            setMessages(messageList);
            setNextMessagesToken(token);
          }
        } catch (error: any) {
          console.error("Não foi possível carregar mensagens:", error);
          toast.error('Não foi possível carregar mensagens');

          if (error.code === 429) {
            toast(
              'Você atingiu o limite de requisições à API do Botpress... Por favor, tente novamente mais tarde'
            );
            throw new AbortError('Limite da API atingido');
          }
        }
      };

      await pRetry(run, {
        onFailedAttempt: (error) => {
          if (error instanceof AbortError) {
            console.log(error.message);
          }
        },
        retries: 5,
      });

      if (isMounted) {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [conversation.id, botpressClient]);

  useEffect(() => {
    // Define o ID do botpress bot como um usuário, procurando em todas as mensagens
    messages.forEach((message) => {
      if (message.direction === 'outgoing') {
        setBotpressBotIdAsAUser(message.userId);
      }
    });
  }, [messages]);

  useEffect(() => {
    if (isDefinedAndHasItems(messages) && !isDefinedAndHasItems(users)) {
      let isMounted = true;

      const fetchUsers = async () => {
        setIsLoadingUsers(true);

        try {
          const userIds = messages.reduce((acc: string[], message: Message) => {
            if (message.userId && !acc.includes(message.userId)) {
              acc.push(message.userId);
            }
            return acc;
          }, []);

          // Busca todos os usuários de forma concorrente
          const userPromises = userIds.map(async (userId) => {
            try {
              const showUserRequest = await botpressClient?.getUser({
                id: userId,
              });

              if (showUserRequest?.user) {
                return showUserRequest.user;
              }
            } catch (error) {
              console.error('Não foi possível carregar os detalhes do usuário', error);
            }
            return null;
          });

          const fetchedUsers = await Promise.all(userPromises);

          if (isMounted) {
            setUsers(fetchedUsers.filter((user) => user !== null) as User[]);
          }
        } catch (error) {
          console.error('Não foi possível carregar os detalhes dos usuários', error);
          toast.error('Não foi possível carregar os detalhes dos usuários');
        } finally {
          if (isMounted) {
            setIsLoadingUsers(false);
          }
        }
      };

      fetchUsers();

      return () => {
        isMounted = false;
      };
    }
  }, [messages, users, botpressClient]);

  const reloadMessageList = useCallback(async () => {
    if (!botpressClient) return;

    const messageContainer = messageListRef.current;
    if (!messageContainer) return;

    // Verifica se está no final da conversa
    const isAtBottom = Math.abs(
      messageContainer.scrollHeight - 
      messageContainer.scrollTop - 
      messageContainer.clientHeight
    ) < 10;

    setIsLoadingMessages(true);

    try {
      const response = await botpressClient.listMessages({
        conversationId: conversation.id,
      });

      if (response) {
        // Ordena as mensagens por data (mais antigas primeiro)
        const sortedMessages = response.messages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Atualiza as mensagens
        setMessages(sortedMessages);
        setNextMessagesToken(response.meta.nextToken || undefined);

        // Ajusta o scroll após a atualização
        requestAnimationFrame(() => {
          if (messageContainer) {
            if (isAtBottom) {
              messageContainer.scrollTop = messageContainer.scrollHeight;
            }
          }
        });
      }
    } catch (error) {
      console.error('Erro ao recarregar mensagens:', error);
      toast.error('Não foi possível recarregar as mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [botpressClient, conversation.id]);

  const addMessageToList = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const getUserName = useCallback(() => {
    if (!conversation.userId) return 'Usuário desconhecido';

    const user = users.find((u) => u.id === conversation.userId);
    return (
      user?.tags['whatsapp:name'] ||
      user?.tags['name'] ||
      conversation.userId ||
      'Usuário desconhecido'
    );
  }, [conversation.userId, users]);

  return (
    <motion.div
      className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cabeçalho da conversa */}
      <motion.div
        className="bg-gradient-to-r from-purple-900 to-purple-500 p-4 flex justify-between items-center"
        layoutId={`header-${conversation.id}`}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <FiMessageSquare className="text-white text-xl" />
          </motion.div>
          <motion.h2
            className="text-lg font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {getUserName()}
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reloadMessageList}
            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
            title="Recarregar conversa"
            aria-label="Recarregar conversa"
          >
            <FiRefreshCw className="h-5 w-5" />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, color: '#ff4444' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleDeleteConversation(conversation.id)}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          aria-label="Excluir conversa"
        >
          <FiTrash2 className="h-5 w-5" />
        </motion.button>
      </motion.div>

      {/* Área de mensagens */}
      <motion.div
        className="flex-1 overflow-hidden bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {isLoadingMessages ? (
          <motion.div
            className="h-full flex items-center justify-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <LoadingAnimation
              label="Carregando mensagens..."
              className="h-8 w-8"
            />
          </motion.div>
        ) : (
          <div
            ref={messageListRef}
            className="h-full flex flex-col overflow-y-auto scroll-smooth"
          >
            <MessageList
              messages={messages}
              loadOlderMessages={loadOlderMessages}
              hasMoreMessages={!!nextMessagesToken}
              handleScrollToBottom={scrollToBottom}
              bottomRef={messageListEndRef}
              conversationId={conversation.id}
              addMessageToList={addMessageToList}
              botpressBotIdAsAUser={botpressBotIdAsAUser}
            />
            <div ref={messageListEndRef} />
          </div>
        )}
      </motion.div>

      {/* Input de mensagem */}
      <motion.div
        className="border-t bg-white p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <MessageInput
          conversationId={conversation.id}
          addMessageToList={addMessageToList}
          handleScrollToBottom={scrollToBottom}
          botpressBotIdAsAUser={botpressBotIdAsAUser}
          reloadMessageList={reloadMessageList}
        />
      </motion.div>
    </motion.div>
  );
};

// Estilize também o MessageInput
interface MessageInputProps {
  conversationId: string;
  addMessageToList: (message: any) => void;
  handleScrollToBottom: () => void;
  botpressBotIdAsAUser?: string;
  reloadMessageList: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  addMessageToList,
  handleScrollToBottom,
  botpressBotIdAsAUser,
}) => {
  const [message, setMessage] = useState('');

  const { botpressClient } = useBotpressClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      // Envia a mensagem usando botpressClient
      const sentMessage = await botpressClient?.createMessage({
        conversationId,
        payload: {
          type: 'text',
          text: message,
        },
        type: 'text',
        userId: botpressBotIdAsAUser || 'user',
        tags: {}
      });

      if (sentMessage?.message) {
        addMessageToList(sentMessage.message);
        setMessage('');
        handleScrollToBottom();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Não foi possível enviar a mensagem');
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex gap-2"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 px-4 py-2 rounded-full border border-gray-200 
              focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
              outline-none transition-all duration-200"
        placeholder="Digite sua mensagem..."
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        className="bg-gradient-to-r from-purple-900 to-purple-500 
              text-white px-6 py-2 rounded-full flex items-center gap-2
              hover:opacity-90 transition-opacity"
        disabled={!message.trim()}
      >
        <span>Enviar</span>
        <FiSend />
      </motion.button>
    </motion.form>
  );
};
