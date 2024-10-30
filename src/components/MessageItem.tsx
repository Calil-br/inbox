import { Message } from '@botpress/client';
import { format } from 'date-fns';

interface TextPayloadBP {
	text: string;
	options?: any;
}

interface MessageItemProps {
	message: Message;
	className?: string;
}

export const MessageItem = ({ message, className }: MessageItemProps) => {
	const isTextPayload = (payload: any): payload is TextPayloadBP => {
		return (payload as TextPayloadBP).text !== undefined && payload.options === undefined;
	};

	return (
		<div
			className={`flex flex-col ${
				message.direction === 'incoming' ? 'self-start items-start pr-5' : 'self-end items-end pl-5'
			} ${className} max-w-[70%]`}
		>
			<div
				className={`px-4 py-2 rounded-lg ${
					message.direction === 'incoming'
						? 'bg-white border border-gray-200'
						: 'bg-blue-500 text-white'
				} shadow-sm`}
			>
				{isTextPayload(message.payload) ? (
					<span className="whitespace-pre-line break-words">
						{message.payload.text}
					</span>
				) : null}
			</div>
			<span className="text-xs text-gray-400 mt-1">
				{format(new Date(message.createdAt), 'HH:mm')}
			</span>
		</div>
	);
};
