import { Conversation, Message } from '@botpress/client';

export interface WhatsAppConversation extends Conversation {
  messages: Message[];
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
