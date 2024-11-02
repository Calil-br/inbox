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
				className={`px-4 py-2 rounded-2xl ${
					message.direction === 'incoming'
						? 'bg-gray-50 border border-gray-100'
						: 'bg-purple-500 text-white'
				} shadow-sm ${
          message.direction === 'incoming' ? 'rounded-tl-sm' : 'rounded-tr-sm'
        }`}
			>
				{isTextPayload(message.payload) ? (
					<div className="flex items-start gap-3">
						{message.direction === 'incoming' && (
							<div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-900 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
								A
							</div>
						)}
						<span className="whitespace-pre-line break-words">
							{message.payload.text}
						</span>
					</div>
				) : null}
			</div>
			<span className="text-xs text-gray-400 mt-1 px-2">
				{format(new Date(message.createdAt), 'HH:mm')}
			</span>
		</div>
	);
};
