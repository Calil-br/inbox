import { Message } from '@botpress/client/dist/gen';
import { MessageItem } from './MessageItem';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';

interface MessageListProps {
	messages: Message[];
	loadOlderMessages: () => void;
	handleScrollToBottom: () => void;
	bottomRef: React.RefObject<HTMLDivElement>;
	hasMoreMessages?: boolean;
	conversationId: string;
	addMessageToList: (message: Message) => void;
	botpressBotIdAsAUser?: string;
}

export const MessageList = ({
	messages,
	loadOlderMessages,
	handleScrollToBottom,
	bottomRef,
	hasMoreMessages,
	conversationId,
	addMessageToList,
	botpressBotIdAsAUser,
}: MessageListProps) => {
	const [messageList, setMessageList] = useState<Message[]>([]);
	const previousScrollHeightRef = useRef<number>(0);
	const messageContainerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const container = messageContainerRef.current;
		if (!container) return;

		const previousScrollHeight = previousScrollHeightRef.current;
		const newScrollHeight = container.scrollHeight;
		
		if (previousScrollHeight > 0) {
			const scrollDiff = newScrollHeight - previousScrollHeight;
			container.scrollTop += scrollDiff;
		}

		previousScrollHeightRef.current = newScrollHeight;
	}, [messageList]);

	useEffect(() => {
		setMessageList(messages);
	}, [messages]);

	return (
		<div 
			ref={messageContainerRef}
			className="flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto"
		>
			{hasMoreMessages && (
				<button
					onClick={loadOlderMessages}
					className="w-full py-2 text-blue-500 hover:text-blue-600"
				>
					Carregar mensagens anteriores
				</button>
			)}
			
			{messageList.length > 0 ? (
				messageList
					.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
					.map((message) => (
						<MessageItem
							key={message.id}
							message={message}
							className="animate-fade-in"
						/>
					))
			) : (
				<div className="flex items-center justify-center h-full text-gray-500">
					Nenhuma mensagem encontrada...
				</div>
			)}
			<div ref={bottomRef} />
		</div>
	);
};
