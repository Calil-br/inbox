import pRetry, { AbortError } from 'p-retry';
import toast from 'react-hot-toast';
import { Conversation, Message, User } from '@botpress/client';
import { LoadingAnimation } from './interface/Loading';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useBotpressClient } from '../hooks/botpressClient';
import { useEffect, useRef, useState } from 'react';
import { isDefinedAndHasItems } from '../utils/arrayUtils';

interface ConversationDetailsProps {
	conversation: Conversation & { userId?: string };
	onDeleteConversation: (conversationId: string) => void;
	messagesInfo?: {
		list: Message[];
		nextToken?: string;
	};
	className?: string;
}

export const ConversationDetails = ({
	conversation,
	onDeleteConversation,
	messagesInfo,
	className,
}: ConversationDetailsProps) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoadingMessages, setIsLoadingMessages] = useState(true);
	const [nextMessagesToken, setNextMessagesToken] = useState<string>();

	const [users, setUsers] = useState<User[]>([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);

	const { botpressClient } = useBotpressClient();
	const [botpressBotIdAsAUser, setBotpressBotIdAsAUser] = useState<string>();

	const messageListEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		handleScrollToBottom();
	}, [messages.length]);

	function handleScrollToBottom() {
		setTimeout(() => {
			if (messageListEndRef.current) {
				messageListEndRef.current.scrollIntoView({ behavior: 'smooth' });
			}
		}, 100);
	}

	async function loadOlderMessages() {
		try {
			if (!nextMessagesToken || !botpressClient) {
				return;
			}

			const getMessages = await botpressClient.listMessages({
				conversationId: conversation.id,
				nextToken: nextMessagesToken,
			});

			setMessages((prevMessages) => [
				...getMessages.messages,
				...prevMessages,
			]);

			setNextMessagesToken(getMessages.meta.nextToken || undefined);
		} catch (error: any) {
			console.log(JSON.stringify(error));

			toast.error("Couldn't load older messages");
		}
	}

	async function handleDeleteConversation(conversationId: string) {
		if (
			confirm(
				'Are you sure you want to delete this conversation?\nAll of its messages and users are gonna be deleted!'
			)
		) {
			try {
				const deleteConversation =
					await botpressClient?.deleteConversation({
						id: conversationId,
					});

				if (deleteConversation) {
					toast.success(
						'This conversation was deleted successfully!'
					);

					onDeleteConversation(conversationId);
				}
			} catch (error: any) {
				console.log(JSON.stringify(error));

				toast.error("Couldn't delete this conversation");
			}
		}
	}

	useEffect(() => {
		setMessages([]); // reset messages
		setUsers([]); // reset users

		if (!botpressClient) {
			return;
		}

		(async () => {
			setIsLoadingMessages(true);

			const run = async () => {
				try {
					let messageList: Message[] = [];
					let token: string | undefined;

					// if the conversation already has already been given the messages data, use it
					if (messagesInfo?.list?.length) {
						messageList = messagesInfo.list;
						token = messagesInfo?.nextToken;
					} else {
						// otherwise, get the messages from the botpress api
						const getMessages = await botpressClient.listMessages({
							conversationId: conversation.id,
						});

						messageList = getMessages.messages;
						token = getMessages.meta.nextToken;
					}

					setMessages(messageList);
					setNextMessagesToken(token);
				} catch (error: any) {
					console.log(JSON.stringify(error));

					toast.error("Couldn't load messages");

					if (error.code === 429) {
						toast(
							'You have reached the limit of requests to the Botpress API... Please try again later'
						);

						throw new AbortError('API limit reached');
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

			setIsLoadingMessages(false);
		})();
	}, [conversation]);

	useEffect(() => {
		// sets the botpress bot id as a user by searching all messages
		messages.forEach((message) => {
			if (message.direction === 'outgoing') {
				setBotpressBotIdAsAUser(message.userId);
			}
		});

		if (isDefinedAndHasItems(messages) && !isDefinedAndHasItems(users)) {
			(async () => {
				setIsLoadingUsers(true);

				try {
					// grabs all user ids from messages
					const userIds = messages.reduce((acc: string[], message: Message) => {
						if (message.userId && !acc.includes(message.userId)) {
							acc.push(message.userId);
						}
						return acc;
					}, []);

					// gets all users from the user ids
					userIds.forEach(async (userId) => {
						try {
							const showUserRequest = await botpressClient?.getUser({
								id: userId,
							});

							if (showUserRequest?.user) {
								setUsers((prevUsers) => [...prevUsers, showUserRequest.user]);
							}
						} catch (error) {
							console.log("Não foi possível carregar os detalhes do usuário");
							console.log(JSON.stringify(error));
						}
					});
				} catch (error) {
					console.log(JSON.stringify(error));
					toast.error("Não foi possível carregar os detalhes dos usuários");
				}

				setIsLoadingUsers(false);
			})();
		}
	}, [messages]);

	useEffect(() => {
		const fetchNewMessages = async () => {
			if (!botpressClient) return;

			try {
				const getMessages = await botpressClient.listMessages({
					conversationId: conversation.id,
				});

				// Verifica se há mensagens novas, evitando duplicatas pelo ID
				const newMessages = getMessages.messages.filter(newMsg => {
					// Verifica se a mensagem já existe no array atual
					const messageExists = messages.some(existingMsg => 
						existingMsg.id === newMsg.id
					);
					return !messageExists;
				});

				if (newMessages.length > 0) {
					setMessages(prevMessages => {
						// Adiciona apenas mensagens únicas
						const uniqueMessages = [...prevMessages];
						newMessages.forEach(newMsg => {
							if (!uniqueMessages.some(msg => msg.id === newMsg.id)) {
								uniqueMessages.push(newMsg);
							}
						});
						return uniqueMessages;
					});
					handleScrollToBottom();
				}
			} catch (error: any) {
				console.error("Erro ao buscar novas mensagens:", error);
				if (error.code === 429) {
					return; // Rate limit atingido
				}
			}
		};

		const interval = setInterval(fetchNewMessages, 20000);
		return () => clearInterval(interval);
	}, [conversation.id, botpressClient, messages]);

	const reloadMessageList = async () => {
		setMessages([]);
		setIsLoadingMessages(true);
		
		try {
			const response = await botpressClient?.listMessages({
				conversationId: conversation.id,
			});

			if (response) {
				setMessages(response.messages);
				setNextMessagesToken(response.meta.nextToken || undefined);
			}
		} catch (error) {
			console.error("Erro ao recarregar mensagens:", error);
			toast.error("Não foi possível recarregar as mensagens");
		} finally {
			setIsLoadingMessages(false);
		}
	};

	const addMessageToList = (message: Message) => {
		setMessages((prevMessages) => [...prevMessages, message]);
	};

	const getUserName = () => {
		if (!conversation.userId) return 'Usuário desconhecido';
		
		const user = users.find(u => u.id === conversation.userId);
		return user?.tags['whatsapp:name'] || 
			   user?.tags['name'] || 
			   conversation.userId || 
			   'Usuário desconhecido';
	};

	return (
		<div className={`flex flex-col h-full ${className}`}>
			{/* Cabeçalho da conversa */}
			<div className="p-4 border-b bg-gray-50 flex justify-between items-center">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-medium">{getUserName()}</h2>
					<button
						onClick={reloadMessageList}
						className="p-1 hover:bg-gray-200 rounded-full"
						title="Recarregar conversa"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
					</button>
				</div>
				<button
					onClick={() => handleDeleteConversation(conversation.id)}
					className="text-red-500 hover:text-red-700"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
					</svg>
				</button>
			</div>

			{/* Área de mensagens - Com scroll melhorado */}
			<div className="flex-1 overflow-hidden">
				{isLoadingMessages ? (
					<div className="h-full flex items-center justify-center">
						<LoadingAnimation label="Carregando mensagens..." className="h-8 w-8" />
					</div>
				) : (
					<div className="h-full flex flex-col overflow-y-auto">
						<MessageList
							messages={messages}
							loadOlderMessages={loadOlderMessages}
							hasMoreMessages={!!nextMessagesToken}
							handleScrollToBottom={handleScrollToBottom}
							bottomRef={messageListEndRef}
							conversationId={conversation.id}
							addMessageToList={addMessageToList}
							botpressBotIdAsAUser={botpressBotIdAsAUser}
						/>
						<div ref={messageListEndRef} />
					</div>
				)}
			</div>

			{/* Input de mensagem */}
			<div className="border-t p-4">
				<MessageInput
					conversationId={conversation.id}
					addMessageToList={addMessageToList}
					handleScrollToBottom={handleScrollToBottom}
					botpressBotIdAsAUser={botpressBotIdAsAUser}
					reloadMessageList={reloadMessageList}
				/>
			</div>
		</div>
	);
};
