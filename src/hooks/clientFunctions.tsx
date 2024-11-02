import { Client, Message, Conversation } from '@botpress/client';

export interface WhatsAppConversation extends Conversation {
	messages?: Message[];
	nextMessagesToken?: string;
	userName?: string;
	userId?: string;
	channel: string;
	integration: 'whatsapp';
	tags: {
		'whatsapp:name'?: string;
		'whatsapp:userId'?: string;
		'whatsapp:about'?: string;
	};
}

export async function listConversationsWithMessages(
	client: Client,
	nextConversationsToken?: string,
	hideEmptyConversations?: boolean
) {
	const listRequest = await client.listConversations({
		nextToken: nextConversationsToken,
	});

	const whatsappConversations = listRequest.conversations
		.filter((conv): conv is WhatsAppConversation => 
			conv.integration === 'whatsapp'
		)
		.map(conv => ({
			...conv,
			messages: undefined,
			nextMessagesToken: undefined
		}));

	if (hideEmptyConversations) {
		const conversationsWithMessages = await filterOutEmptyConversations(
			client,
			whatsappConversations
		);

		return {
			conversations: conversationsWithMessages,
			nextConversationsToken: listRequest.meta.nextToken,
		};
	}

	return {
		conversations: whatsappConversations,
		nextConversationsToken: listRequest.meta.nextToken,
	};
}

export async function listMessagesByConversationId(
	client: Client,
	conversationId: string,
	nextMessagesToken?: string
) {
	const listRequest = await client.listMessages({
		conversationId,
		nextToken: nextMessagesToken,
	});

	return {
		messages: listRequest.messages,
		nextMessagesToken: listRequest.meta.nextToken,
	};
}

export async function getBotInfo(client: Client, botId: string) {
	const botInfo = await client.getBot({
		id: botId,
	});

	return {
		name: botInfo.bot.name,
	};
}

export async function filterOutEmptyConversations(
	client: Client,
	conversations: WhatsAppConversation[]
) {
	for (const conversation of conversations) {
		const { messages, nextMessagesToken } =
			await listMessagesByConversationId(client, conversation.id);

		conversation.messages = messages;
		conversation.nextMessagesToken = nextMessagesToken;
	}

	return conversations.filter(
		(conversation) => conversation.messages!.length > 0
	);
}
