import toast from 'react-hot-toast';
import { AbortError } from 'p-retry';
import { Conversation, Message } from '@botpress/client';
import { ConversationDetails } from '../components/ConversationDetails';
import { ConversationList } from '../components/ConversationList';
import { Header } from '../components/interface/Header';
import { listConversationsWithMessages } from '../hooks/clientFunctions';
import { LoginPage } from '../components/LoginPage';
import { useBotpressClient } from '../hooks/botpressClient';
import { useEffect, useState, useCallback } from 'react';
import {
	clearStoredCredentials,
	getStoredCredentials,
} from '../services/storage';
import { Contacts } from '../components/Contacts';
import { SendCustomMessage } from '../components/SendCustomMessage'; // Adicione este import
import { motion } from 'framer-motion';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  about?: string;
}

export interface ConversationWithMessages extends Conversation {
	messages: Message[];
	nextMessagesToken?: string;
	userName?: string;
	userId?: string;
}

export const Dashboard = () => {
	const [] =
		useState<boolean>(true);

	const [botInfo, setBotInfo] = useState<{
		id?: string;
		name?: string;
	}>({});
	const [selectedConversation, setSelectedConversation] =
		useState<ConversationWithMessages>();

	const [conversationList, setConversationList] = useState<
		ConversationWithMessages[]
	>([]);
	const [nextConversationsToken, setNextConversationsToken] =
		useState<string>();

	const [contacts, setContacts] = useState<Contact[]>([]);

	const { botpressClient, createClient, deleteClient } = useBotpressClient();

	const [, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

	const [, setIsLoadingContacts] = useState(true);

	function clearsCredentialsAndClient() {
		deleteClient();
		clearStoredCredentials();
	}

	const addContact = (contact: Contact) => {
		setContacts((prevContacts) => {
			if (prevContacts.find((c) => c.id === contact.id)) {
				return prevContacts;
			}
			return [...prevContacts, contact];
		});
	};

	// Memoização da função de verificação de mudanças
	const checkForChanges = useCallback((updated: ConversationWithMessages[], current: ConversationWithMessages[]) => {
		return updated.some((updatedConvo) => {
			const existingConvo = current.find(convo => convo.id === updatedConvo.id);
			return !existingConvo || 
				   existingConvo.messages.length !== updatedConvo.messages.length ||
				   existingConvo.updatedAt !== updatedConvo.updatedAt;
		});
	}, []);

	// Otimização do refreshConversations
	const refreshConversations = useCallback(async () => {
		if (!botpressClient) return;

		try {
			setIsLoadingContacts(true);
			const getConversations = await listConversationsWithMessages(
				botpressClient,
				undefined,
				true
			);

			const updatedConversations = getConversations.conversations as ConversationWithMessages[];
			
			// Evita processamento desnecessário
			if (!checkForChanges(updatedConversations, conversationList)) {
				return;
			}

			const processedConversations = await Promise.all(
				updatedConversations.map(conversation => processConversation(conversation, botpressClient))
			);
			
			setConversationList(processedConversations);
			setNextConversationsToken(getConversations.nextConversationsToken);
		} catch (error) {
			console.error('Erro ao atualizar conversas:', error);
		} finally {
			setIsLoadingContacts(false);
		}
	}, [botpressClient, conversationList, checkForChanges]);

	// Memoização do processamento de conversas
	const processConversation = useCallback(async (convo: ConversationWithMessages, client: any) => {
		const incomingMessage = convo.messages
			.slice()
			.reverse()
			.find((msg) => msg.direction === 'incoming');

		if (!incomingMessage?.userId) {
			return { ...convo, userName: 'Usuário sem nome' };
		}

		try {
			const user = await client.getUser({ id: incomingMessage.userId });
			const userName = user.user.tags['whatsapp:name'] || user.user.tags['name'] || 'Usuário sem nome';
			
			// Adiciona o contato automaticamente
			addContact({
				id: incomingMessage.userId,
				name: userName,
				phone: user.user.tags['whatsapp:userId'],
				about: user.user.tags['whatsapp:about']
			});

			return {
				...convo,
				userName,
				userId: incomingMessage.userId
			};
		} catch (error) {
			console.error(`Erro ao buscar usuário ${incomingMessage.userId}:`, error);
			return { ...convo, userName: 'Usuário sem nome' };
		}
	}, [addContact]);

	// Otimização do useEffect para auto-refresh
	useEffect(() => {
		if (!botpressClient) return;

		const interval = setInterval(refreshConversations, 15000);
		setAutoRefreshInterval(interval);

		return () => clearInterval(interval);
	}, [botpressClient, refreshConversations]);

	useEffect(() => {
		if (!botpressClient) {
			try {
				const credentials = getStoredCredentials();

				if (credentials) {
					createClient(
						credentials.token,
						credentials.workspaceId,
						credentials.botId
					);

					setBotInfo({
						id: credentials.botId,
						name: 'Loading',
					});
				}
			} catch (error: any) {
				toast("Couldn't start the app");
				toast.error(error.message || error);
			}
		} else {
			if (conversationList.length === 0) {
				refreshConversations();
			}

			// Carregar informações do bot
			(async () => {
				try {
					if (botInfo.id) {
						const getBot = await botpressClient.getBot({
							id: botInfo.id,
						});

						setBotInfo((prev) => ({
							...prev,
							name: getBot.bot.name,
						}));
					}
				} catch (error) {
					console.log(JSON.stringify(error));
					toast.error("Couldn't load bot info");
				}
			})();
		}
	}, [botpressClient]);

	async function loadOlderConversations() {
		if (!botpressClient) {
			return;
		}

		try {
			console.log('LOADING OLDER CONVERSATIONS');
			const getConversations = await listConversationsWithMessages(
				botpressClient,
				nextConversationsToken,
				true
			);

			let updatedConversations: ConversationWithMessages[] =
				getConversations.conversations as ConversationWithMessages[];

			for (let convo of updatedConversations) {
				const incomingMessage = convo.messages
					.slice()
					.reverse()
					.find((msg) => msg.direction === 'incoming');

				if (incomingMessage && incomingMessage.userId) {
					try {
						const user = await botpressClient.getUser({
							id: incomingMessage.userId,
						});
						convo.userName =
							user.user.tags['whatsapp:name'] ||
							user.user.tags['name'] ||
							'Usuário sem nome';
						convo.userId = incomingMessage.userId;
						addContact({
							id: incomingMessage.userId,
							name: convo.userName,
							phone: user.user.tags['whatsapp:userId'],
							about: user.user.tags['whatsapp:about'] || undefined,
						});
					} catch (error: any) {
						console.log(
							`Não foi possível buscar o nome do usuário com ID ${incomingMessage.userId}`
						);
						convo.userName = 'Usuário sem nome';
						convo.userId = undefined;
					}
				} else {
					convo.userName = 'Usuário sem nome';
					convo.userId = undefined;
				}
			}

			setConversationList((prevConversations) => [
				...prevConversations,
				...updatedConversations,
			]);

			setNextConversationsToken(
				getConversations.nextConversationsToken
			);
		} catch (error: any) {
			console.log(JSON.stringify(error));

			if (error.code === 429) {
				toast(
					'You have reached the limit of requests to the Botpress API... Please try again later'
				);

				throw new AbortError('API limit reached');
			}

			toast.error("Couldn't load older conversations");
		}
	}

	const handleSelectContact = (contactId: string) => {
		const conversation = conversationList.find(convo => convo.userId === contactId);
		if (conversation) {
			setSelectedConversation(conversation);
		} else {
			toast.error("Conversa não encontrada para este contato");
		}
	};

	return botpressClient ? (
		<div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-gray-100">
			<Header
				handleLogout={clearsCredentialsAndClient}
				botName={botInfo.name}
				className="flex-shrink-0 mx-6 my-4"
			/>
			<div className="flex flex-1 overflow-hidden px-6 pb-6 gap-6">
				{/* Painel esquerdo - Lista de conversas */}
				<motion.div 
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="flex flex-col w-96 bg-white rounded-xl shadow-lg overflow-hidden 
						transition-all duration-200 hover:shadow-xl border border-gray-100"
				>
					<ConversationList
						conversations={conversationList}
						contacts={contacts}
						onSelectConversation={setSelectedConversation}
						selectedConversationId={selectedConversation?.id}
						loadOlderConversations={loadOlderConversations}
						hasMoreConversations={!!nextConversationsToken}
					/>
				</motion.div>
				
				{/* Painel central - Detalhes da conversa */}
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex-1 flex flex-col bg-white rounded-xl shadow-lg overflow-hidden 
						transition-all duration-200 hover:shadow-xl border border-gray-100"
				>
					{selectedConversation ? (
						<ConversationDetails
							conversation={selectedConversation}
							messagesInfo={{
								list: selectedConversation.messages,
								nextToken: selectedConversation.nextMessagesToken,
							}}
							onDeleteConversation={(id) => {
								setSelectedConversation(undefined);
								setConversationList(prev => prev.filter(c => c.id !== id));
							}}
						/>
					) : (
						<div className="h-full flex items-center justify-center text-gray-500 flex-col gap-6">
							<motion.div 
								whileHover={{ scale: 1.05 }}
								className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-900 to-purple-500 
									flex items-center justify-center text-white shadow-lg"
							>
								<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
								</svg>
							</motion.div>
							<span className="text-xl font-medium text-gray-600">
								Selecione uma conversa para começar
							</span>
						</div>
					)}
				</motion.div>

				{/* Painel direito - Envio de mensagens customizadas e contatos */}
				<motion.div 
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					className="w-80 flex flex-col gap-6"
				>
					<SendCustomMessage className="flex-shrink-0 transition-all duration-200 hover:shadow-xl" />
					<Contacts
						contacts={contacts}
						onSelectContact={handleSelectContact}
						className="flex-1 transition-all duration-200 hover:shadow-xl"
					/>
				</motion.div>
			</div>
		</div>
	) : (
		<LoginPage clearsCredentialsAndClient={clearsCredentialsAndClient} />
	);
};