import { Message } from '@botpress/client';
import { format } from 'date-fns';
import axios from 'axios';
import { useState } from 'react';

interface TextPayloadBP {
	text: string;
	options?: any;
}

interface ImagePayloadBP {
	imageUrl: string;
}

interface MessageItemProps {
	message: Message;
	className?: string;
}

export const MessageItem = ({ message, className }: MessageItemProps) => {
	const [imageData, setImageData] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const isTextPayload = (payload: any): payload is TextPayloadBP => {
		return (payload as TextPayloadBP).text !== undefined && payload.options === undefined;
	};

	const isImagePayload = (payload: any): payload is ImagePayloadBP => {
		return (payload as ImagePayloadBP).imageUrl !== undefined;
	};

	const handleLoadImage = async () => {
		if (isImagePayload(message.payload)) {
			try {
				setIsLoading(true);
				setErrorMessage(null);
				console.log('Fazendo requisição para:', message.payload.imageUrl);
				
				const webhookResponse = await axios.post<ArrayBuffer>(
					'https://hook.us1.make.com/c7xnulzt6l2dw7mgjkc2jo0kvhuvgjvk',
					{
						fileUrl: message.payload.imageUrl
					},
					{
						responseType: 'arraybuffer',
						headers: {
							'Content-Type': 'application/json',
							'Accept': 'image/jpeg'
						}
					}
				);

				const text = new TextDecoder().decode(webhookResponse.data);
				if (text === 'erro') {
					setErrorMessage('Imagem não está mais disponível');
					return;
				}

				if (webhookResponse.data) {
					const arrayBuffer = webhookResponse.data as ArrayBuffer;
					const uint8Array = new Uint8Array(arrayBuffer);
					const base64 = btoa(
						uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
					);
					
					const imageDataUrl = `data:image/jpeg;base64,${base64}`;
					setImageData(imageDataUrl);
				}
			} catch (error) {
				console.error('A imagem não está mais disponível:', error);
				setErrorMessage('A imagem não está mais disponível');
			} finally {
				setIsLoading(false);
			}
		}
	};

	return (
		<>
			{isModalOpen && imageData && (
				<div 
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
					onClick={() => setIsModalOpen(false)}
				>
					<div className="relative max-w-full max-h-full">
						<img 
							src={imageData} 
							alt="Imagem em tamanho original"
							className="max-w-full max-h-[90vh] object-contain rounded-lg"
							onClick={(e) => e.stopPropagation()}
						/>
						<button
							className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
							onClick={() => setIsModalOpen(false)}
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			)}

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
					) : isImagePayload(message.payload) ? (
						<div className="flex items-start gap-3">
							{message.direction === 'incoming' && (
								<div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-900 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
									A
								</div>
							)}
							{!imageData ? (
								<div className="flex flex-col gap-2">
									<button
										onClick={handleLoadImage}
										disabled={isLoading}
										className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-purple-300"
									>
										{isLoading ? 'Carregando...' : errorMessage || 'Carregar Imagem'}
									</button>
								</div>
							) : (
								<img 
									src={imageData} 
									alt="Mensagem com imagem" 
									className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
									style={{ maxWidth: '300px' }}
									onClick={() => setIsModalOpen(true)}
									onError={(e) => console.error('Erro ao carregar imagem:', e)}
									onLoad={() => console.log('Imagem carregada com sucesso')}
								/>
							)}
						</div>
					) : null}
				</div>
				<span className="text-xs text-gray-400 mt-1 px-2">
					{format(new Date(message.createdAt), 'HH:mm')}
				</span>
			</div>
		</>
	);
};
