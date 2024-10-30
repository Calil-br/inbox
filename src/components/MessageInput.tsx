import toast from 'react-hot-toast';
import { CreateMessageBody, Message } from '@botpress/client/dist/gen';
import { useBotpressClient } from '../hooks/botpressClient';
import { useState, useRef } from 'react';

interface MessageInputProps {
	conversationId: string;
	addMessageToList: (message: Message) => void;
	handleScrollToBottom: () => void;
	botpressBotIdAsAUser?: string;
	reloadMessageList: () => void;
}

export const MessageInput = ({
	conversationId,
	addMessageToList,
	handleScrollToBottom,
	botpressBotIdAsAUser,
	reloadMessageList,
}: MessageInputProps) => {
	const [messageInput, setMessageInput] = useState<string>('');
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const { botpressClient } = useBotpressClient();

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	async function handleSendMessage() {
		if (!messageInput.trim()) return;
		
		try {
			const sendMessageBody: CreateMessageBody = {
				conversationId,
				userId: botpressBotIdAsAUser!,
				payload: { text: messageInput },
				type: 'text',
				tags: {},
			};

			const sendMessage = await botpressClient?.createMessage(sendMessageBody);

			if (sendMessage && sendMessage.message) {
				setMessageInput('');
				addMessageToList(sendMessage.message);
				handleScrollToBottom();
				reloadMessageList?.(); // Chamada opcional
			}
		} catch (error: any) {
			console.log(JSON.stringify(error));
			toast.error("Não foi possível enviar a mensagem");
		}
	}

	return botpressBotIdAsAUser ? (
		<div className="flex items-end gap-2 p-4 border-t bg-gray-50">
			<textarea
				ref={inputRef}
				rows={1}
				className="flex-1 resize-none rounded-lg border-2 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="Digite uma mensagem..."
				value={messageInput}
				onChange={(e) => setMessageInput(e.target.value)}
				onKeyDown={handleKeyPress}
			/>
			<button
				className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-gray-300"
				onClick={handleSendMessage}
				disabled={!messageInput.trim()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
				</svg>
			</button>
		</div>
	) : (
		<div className="p-4 text-center text-gray-500 bg-gray-50 border-t">
			Você só pode enviar mensagens em conversas onde seu bot já interagiu...
		</div>
	);
};
