import React, { useState, useRef } from 'react';
import { ConversationItem } from './ConversationItem';
import { ConversationWithMessages } from '../pages/Dashboard';
import { LoadingAnimation } from './interface/Loading';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';

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
		<motion.div 
			className={`flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
		>
			<div className="bg-gradient-to-r from-purple-900 to-purple-500 p-4">
				<div className="relative">
					<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						placeholder="Pesquisar conversa..."
						className="w-full pl-10 pr-4 py-2 border rounded-full
							focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
							outline-none transition-all duration-200"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			<div 
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto"
				onScroll={handleScroll}
			>
				<div className="divide-y divide-gray-100">
					{sortedUniqueConversations.map((conversation) => (
						<div
							key={conversation.id}
							className={`p-4 transition-colors ${
								conversation.id === selectedConversationId
									? 'bg-gray-50'
									: 'hover:bg-gray-50'
							}`}
						>
							<div className="flex items-center justify-between">
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
									className={`ml-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
										inProgressConversations.has(conversation.id)
											? 'bg-green-100 text-green-700 hover:bg-green-200'
											: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
									}`}
								>
									{inProgressConversations.has(conversation.id) ? 'Em atendimento' : 'Atender'}
								</button>
							</div>
						</div>
					))}
					{isLoading && (
						<div className="p-4 flex justify-center">
							<LoadingAnimation label="Carregando conversas..." className="h-6 w-6" />
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
};