import toast from 'react-hot-toast';
import { AbortError } from 'p-retry';
import { Conversation, Message } from '@botpress/client';
import { ConversationDetails } from '../components/ConversationDetails';
import { ConversationList } from '../components/ConversationList';
import { Header } from '../components/interface/Header';
import { listConversationsWithMessages } from '../hooks/clientFunctions';
import { LoadingAnimation } from '../components/interface/Loading';
import { LoginPage } from '../components/LoginPage';
import { useBotpressClient } from '../hooks/botpressClient';
import { useEffect, useState } from 'react';
import {
	clearStoredCredentials,
	getStoredCredentials,
} from '../services/storage';
import { Contacts } from '../components/Contacts';
import { SendCustomMessage } from '../components/SendCustomMessage'; // Adicione este import

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
	const [isLoadingConversations, setIsLoadingConversations] =
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

	const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

	const [isLoadingContacts, setIsLoadingContacts] = useState(true);

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

	const refreshConversations = async () => {
		if (!botpressClient) return;

		try {
			console.log('Verificando atualizações...');
			const getConversations = await listConversationsWithMessages(
				botpressClient,
				undefined,
				true
			);

			let updatedConversations: ConversationWithMessages[] =
				getConversations.conversations as ConversationWithMessages[];

			// Remove duplicatas das conversas existentes
			const existingIds = new Set(conversationList.map(c => c.id));
			const newConversations = updatedConversations.filter(c => !existingIds.has(c.id));

			// Verifica mudanças nas conversas existentes
			const hasChanges = updatedConversations.some((updatedConvo) => {
				const existingConvo = conversationList.find(convo => convo.id === updatedConvo.id);
				return !existingConvo || 
					   existingConvo.messages.length !== updatedConvo.messages.length ||
					   existingConvo.updatedAt !== updatedConvo.updatedAt;
			});

			if (hasChanges || newConversations.length > 0) {
				setIsLoadingContacts(true);
				console.log('Atualizando conversas e contatos...');

				const newContacts: Contact[] = [];

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
							newContacts.push({
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

				// Atualiza a lista de conversas mantendo apenas uma instância de cada
				setConversationList(prevList => {
					const mergedList = [...prevList];
					updatedConversations.forEach(updatedConvo => {
						const index = mergedList.findIndex(c => c.id === updatedConvo.id);
						if (index !== -1) {
							mergedList[index] = updatedConvo;
						} else {
							mergedList.push(updatedConvo);
						}
					});
					return mergedList;
				});

				setNextConversationsToken(getConversations.nextConversationsToken);
				setContacts(prevContacts => {
					const uniqueContacts = [...prevContacts];
					newContacts.forEach(newContact => {
						const index = uniqueContacts.findIndex(c => c.id === newContact.id);
						if (index !== -1) {
							uniqueContacts[index] = newContact;
						} else {
							uniqueContacts.push(newContact);
						}
					});
					return uniqueContacts;
				});
			} else {
				console.log('Nenhuma atualização necessária.');
			}
		} catch (error: any) {
			console.log('Erro ao atualizar conversas:', JSON.stringify(error));
		} finally {
			setIsLoadingContacts(false);
		}
	};

	useEffect(() => {
		if (botpressClient) {
			const interval = setInterval(refreshConversations, 15000); // 15 segundos
			setAutoRefreshInterval(interval);

			return () => {
				if (autoRefreshInterval) {
					clearInterval(autoRefreshInterval);
				}
			};
		}
	}, [botpressClient]);

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
		<div className="flex flex-col h-screen bg-gray-100">
			<Header
				handleLogout={clearsCredentialsAndClient}
				botName={botInfo.name}
				className="flex-shrink-0"
			/>
			<div className="flex flex-1 overflow-hidden p-4 gap-4">
				{/* Painel esquerdo - Lista de conversas */}
				<div className="flex flex-col w-96 bg-white rounded-lg shadow-sm overflow-hidden">
					<ConversationList
						conversations={conversationList}
						contacts={contacts}
						onSelectConversation={setSelectedConversation}
						selectedConversationId={selectedConversation?.id}
						loadOlderConversations={loadOlderConversations}
						hasMoreConversations={!!nextConversationsToken}
					/>
				</div>
				
				{/* Painel central - Detalhes da conversa */}
				<div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
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
						<div className="h-full flex items-center justify-center text-gray-500">
							Selecione uma conversa para começar
						</div>
					)}
				</div>

				{/* Painel direito - Envio de mensagens customizadas e contatos */}
				<div className="w-80 flex flex-col gap-4">
					<SendCustomMessage className="flex-shrink-0" />
					<Contacts
						contacts={contacts}
						onSelectContact={handleSelectContact}
						className="flex-1"
					/>
				</div>
			</div>
		</div>
	) : (
		<LoginPage clearsCredentialsAndClient={clearsCredentialsAndClient} />
	);
};
