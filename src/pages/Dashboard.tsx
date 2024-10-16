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

			// Verifica se há mudanças nas conversas
			const hasChanges = updatedConversations.some((updatedConvo) => {
				const existingConvo = conversationList.find(convo => convo.id === updatedConvo.id);
				return !existingConvo || existingConvo.messages.length !== updatedConvo.messages.length;
			});

			if (hasChanges) {
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

				setConversationList(updatedConversations);
				setNextConversationsToken(getConversations.nextConversationsToken);
				setContacts(newContacts);
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
		<div className="flex flex-col h-screen overflow-hidden bg-zinc-100 text-gray-800">
			<Header
				handleLogout={clearsCredentialsAndClient}
				botName={botInfo.name}
				className="flex-shrink-0 h-14"
			/>
			<div className="mx-2 mb-2 gap-2 flex overflow-hidden h-full">
				<div className="flex flex-col gap-2 w-1/4">
					<aside className="w-full flex-col flex flex-1 rounded-md border border-zinc-200 overflow-auto">
						<ConversationList
							conversations={conversationList}
							contacts={contacts} // Adicionando a lista de contatos
							onSelectConversation={(conversation: ConversationWithMessages) =>
								setSelectedConversation(conversation)
							}
							selectedConversationId={selectedConversation?.id}
							loadOlderConversations={loadOlderConversations}
							hasMoreConversations={nextConversationsToken ? true : false}
							className="bg-white"
						/>

						{isLoadingConversations && (
							<div className="self-center bg-zinc-200 p-6 text-lg font-medium rounded-md my-auto flex flex-col items-center gap-5">
								<LoadingAnimation label="Loading messages..." />
								Loading conversations...
							</div>
						)}
					</aside>
					<Contacts contacts={contacts} onSelectContact={handleSelectContact} isLoading={isLoadingContacts} />
				</div>

				<div className="flex w-3/4 h-full">
					{selectedConversation ? (
						<ConversationDetails
							conversation={selectedConversation}
							messagesInfo={{
								list: selectedConversation.messages,
								nextToken:
									selectedConversation.nextMessagesToken,
							}}
							className="w-full gap-1"
							onDeleteConversation={(conversationId: string) => {
								setSelectedConversation(undefined);
								setConversationList((prev) =>
									prev.filter(
										(conversation) =>
											conversation.id !== conversationId
									)
								);
							}}
						/>
					) : (
						<div className="bg-zinc-200 p-5 text-lg font-medium rounded-md my-auto mx-auto">
							Select a conversation to see details
						</div>
					)}
				</div>
			</div>
		</div>
	) : (
		<LoginPage clearsCredentialsAndClient={clearsCredentialsAndClient} />
	);
};
