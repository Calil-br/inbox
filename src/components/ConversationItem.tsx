import { memo } from 'react';
import differenceInDays from 'date-fns/differenceInDays';
import { Conversation } from '@botpress/client';
import { getCountLabel } from '../utils';
import { motion } from 'framer-motion';

interface ConversationItemProps {
	conversation: Conversation;
	userName: string;
	isSelected?: boolean;
	onClick?: () => void;
}

const INTEGRATION_COLORS = {
	whatsapp: 'bg-emerald-500 hover:bg-emerald-600',
	telegram: 'bg-sky-500 hover:bg-sky-600',
	default: 'bg-zinc-500 hover:bg-zinc-600'
} as const;

export const ConversationItem = memo(({
	conversation,
	userName,
	isSelected,
	onClick
}: ConversationItemProps) => {
	const daysLabel = getCountLabel(
		differenceInDays(new Date(), new Date(conversation.updatedAt)),
		'dia atrás',
		'dias atrás',
		'Hoje',
		true
	);

	const integrationColor = 
		INTEGRATION_COLORS[conversation.integration as keyof typeof INTEGRATION_COLORS] ?? 
		INTEGRATION_COLORS.default;

	return (
		<motion.div
			onClick={onClick}
			className={`
				p-4 hover:bg-gray-50 cursor-pointer transition-colors divide-y divide-gray-100
				${isSelected ? 'bg-gray-50' : ''}
			`}
			whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
		>
			<div className="flex items-center gap-3">
				<div className="relative">
					<div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-900 to-purple-500 flex items-center justify-center text-white font-bold">
						{userName.charAt(0).toUpperCase()}
					</div>
					<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
				</div>

				<div className="flex flex-col items-start leading-snug min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-medium text-gray-900">{userName}</span>
						<span
							className={`
								px-3 py-1 rounded-full
								text-white text-xs font-medium
								transition-colors duration-200 ease-in-out
								${integrationColor}
							`}
						>
							{conversation.integration}
						</span>
					</div>
					<span className="text-sm text-gray-500">{daysLabel}</span>
				</div>
			</div>
		</motion.div>
	);
});

ConversationItem.displayName = 'ConversationItem';