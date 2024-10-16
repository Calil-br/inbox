import InfiniteScroll from 'react-infinite-scroller';
import { ConversationItem } from './ConversationItem';
import { ConversationWithMessages } from '../pages/Dashboard';
import { LoadingAnimation } from './interface/Loading';
import { useRef } from 'react';

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
	contacts, // Novo prop
	onSelectConversation,
	loadOlderConversations,
	hasMoreConversations,
	selectedConversationId,
	className,
}: ConversationListProps) => {
	const observerTarget = useRef<HTMLDivElement>(null);

	// Função para obter o nome do usuário com base no ID da conversa
	const getUserName = (conversation: ConversationWithMessages) => {
		const contact = contacts.find(c => c.id === conversation.userId);
		return contact ? contact.name : 'Usuário desconhecido';
	};

	return (
		<InfiniteScroll
			pageStart={0}
			loadMore={loadOlderConversations}
			hasMore={hasMoreConversations}
			loader={
					<div
						className="loader rounded-md px-3 py-2 flex items-center gap-2 m-3 border-2 font-medium"
						key={0}
					>
						<LoadingAnimation
							label={'Loading conversations'}
							className="h-6 w-6"
						/>
						Loading older conversations...
					</div>
			}
			useWindow={false}
		>
			<div
				className={`flex flex-col items-center w-full divide-y-2 ${className}`}
			>
				{conversations
					.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
					.map((conversation) => (
						<button
							className="w-full"
							onClick={() => onSelectConversation(conversation)}
							key={conversation.id}
						>
							<ConversationItem
								conversation={conversation}
								userName={getUserName(conversation)} // Usando a função getUserName
								isSelected={conversation.id === selectedConversationId}
							/>
						</button>
					))}
				<div ref={observerTarget} />
			</div>
			{!hasMoreConversations && (
				<div className="rounded-md p-2 m-3 text-center border-2 font-medium">
					No more conversations
				</div>
			)}
		</InfiniteScroll>
	);
};
