import React, { useState, useRef, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { ConversationItem } from './ConversationItem';
import { ConversationWithMessages } from '../pages/Dashboard';
import { LoadingAnimation } from './interface/Loading';

interface Contact {
	id: string;
	name: string;
	phone?: string;
	about?: string;
}

interface ConversationListProps {
	conversations: ConversationWithMessages[];
	contacts: Contact[]; // Adicionado a lista de contatos
	onSelectConversation: (conversation: ConversationWithMessages) => void;
	loadOlderConversations: () => Promise<void>;
	hasMoreConversations?: boolean;
	selectedConversationId?: string;
	className?: string;
}

export const ConversationList = ({
	conversations,
	contacts,
	onSelectConversation,
	loadOlderConversations,
	hasMoreConversations,
	selectedConversationId,
	className,
}: ConversationListProps) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [inProgressConversations, setInProgressConversations] = useState<Set<string>>(new Set());
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const handleLoadMore = async () => {
		if (!isLoading && hasMoreConversations) {
			try {
				setIsLoading(true);
				await loadOlderConversations();
			} catch (error) {
				console.error('Erro ao carregar mais conversas:', error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	const toggleInProgress = (conversationId: string, event: React.MouseEvent) => {
		event.stopPropagation(); // Evita que o clique do botão selecione a conversa
		setInProgressConversations(prev => {
			const newSet = new Set(prev);
			if (newSet.has(conversationId)) {
				newSet.delete(conversationId);
			} else {
				newSet.add(conversationId);
			}
			return newSet;
		});
	};

	// Função para verificar se chegou ao final do scroll
	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const target = e.target as HTMLDivElement;
		const scrollPosition = target.scrollHeight - target.scrollTop;
		const threshold = target.clientHeight + 50; // 50px antes do final

		if (scrollPosition <= threshold && !isLoading && hasMoreConversations) {
			console.log('Próximo do final, carregando mais conversas...');
			handleLoadMore();
		}
	};

	const sortedUniqueConversations = conversations
		.filter((conversation, index, self) =>
			index === self.findIndex((c) => c.id === conversation.id)
		)
		.sort((a, b) => {
			// Primeiro critério: conversas em atendimento no topo
			const aInProgress = inProgressConversations.has(a.id);
			const bInProgress = inProgressConversations.has(b.id);
			if (aInProgress && !bInProgress) return -1;
			if (!aInProgress && bInProgress) return 1;
			// Segundo critério: ordenação por data
			return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		})
		.filter(conversation => {
			const contact = contacts.find(c => c.id === conversation.userId);
			const userName = contact ? contact.name : 'Usuário desconhecido';
			return userName.toLowerCase().includes(searchTerm.toLowerCase());
		});

	const getUserName = (conversation: ConversationWithMessages) => {
		const contact = contacts.find(c => c.id === conversation.userId);
		return contact ? contact.name : 'Usuário desconhecido';
	};

	return (
		<div className="flex flex-col h-full">
			<div className="p-3 border-b">
				<input
					type="text"
					placeholder="Pesquisar conversa..."
					className="w-full px-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>

			<div 
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto"
				onScroll={handleScroll}
			>
				<div className={`flex flex-col ${className}`}>
					{sortedUniqueConversations.map((conversation) => (
						<div
							key={conversation.id}
							className={`flex items-center justify-between p-3 ${
								conversation.id === selectedConversationId
									? 'bg-blue-50'
									: 'hover:bg-gray-50'
							}`}
						>
							<button
								className="flex-1"
								onClick={() => onSelectConversation(conversation)}
							>
								<ConversationItem
									conversation={conversation}
									userName={getUserName(conversation)}
									isSelected={conversation.id === selectedConversationId}
								/>
							</button>
							
							<button
								onClick={(e) => toggleInProgress(conversation.id, e)}
								className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
									inProgressConversations.has(conversation.id)
										? 'bg-green-100 text-green-700 hover:bg-green-200'
										: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
								}`}
							>
								{inProgressConversations.has(conversation.id) ? 'Em atendimento' : 'Atender'}
							</button>
						</div>
					))}
					{isLoading && (
						<div className="px-3 py-2 flex items-center justify-center">
							<LoadingAnimation label="Carregando conversas..." className="h-6 w-6" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
