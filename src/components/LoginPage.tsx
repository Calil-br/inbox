import toast from 'react-hot-toast';
import { Disclaimer } from './interface/Disclaimer';
import { storeCredentials } from '../services/storage';
import { useBotpressClient } from '../hooks/botpressClient';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from './interface/Header';
import { FiKey } from 'react-icons/fi';

interface LoginPageProps {
	clearsCredentialsAndClient: () => void;
}

export function LoginPage({ clearsCredentialsAndClient }: LoginPageProps) {
	const [userBotpressToken, setUserBotpressToken] = useState<string>('');
	const [userBotpressURL, setUserBotpressURL] = useState<string>('');

	const { createClient } = useBotpressClient();

	function handleSubmitCredentials(token: string, url: string) {
		if (!token || !url) {
			toast.error('Please inform all the credentials');
			return;
		}

		try {
			const splittedURL = url.split('/');
			const workspaceId = splittedURL[4];
			const botId = splittedURL[6];

			if (!workspaceId || !botId) {
				throw new Error();
			}

			const bpClient = createClient(token, workspaceId, botId);

			if (!bpClient) {
				throw new Error();
			}

			// saves the encrypted credentials to storage
			storeCredentials({ token, workspaceId, botId });
		} catch (error) {
			toast.error('You have informed invalid credentials');

			clearsCredentialsAndClient();
		}

		setUserBotpressToken('');
		setUserBotpressURL('');
	}

	return (
		<div className="flex flex-col h-screen gap-4 p-4 bg-gray-50">
			<Header handleLogout={() => {}} className="w-full" />
			
			<motion.div 
				className="flex flex-col gap-5 w-full max-w-xl mx-auto"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<Disclaimer full />

				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					<div className="bg-gradient-to-r from-purple-900 to-purple-500 p-4">
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<FiKey className="text-2xl" />
							Credenciais de Acesso
						</h2>
					</div>

					<div className="p-6">
						<div className="flex flex-col gap-4">
							<label className="flex flex-col gap-1">
								<span className="text-gray-700 font-medium">
									URL do Dashboard do Bot
								</span>
								<input
									type="text"
									className="px-4 py-2 rounded-full border
										focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
										outline-none transition-all duration-200"
									value={userBotpressURL}
									onChange={(event) => setUserBotpressURL(event.target.value)}
								/>
							</label>

							<label className="flex flex-col gap-1">
								<span className="text-gray-700 font-medium">
									Token de Acesso Pessoal
								</span>
								<input
									type="password"
									className="px-4 py-2 rounded-full border
										focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
										outline-none transition-all duration-200"
									value={userBotpressToken}
									onChange={(event) => setUserBotpressToken(event.target.value)}
								/>

							</label>

							<button
								className="w-full p-3 rounded-full bg-gradient-to-r from-purple-900 to-purple-500 
									hover:opacity-90 transition-opacity mt-4"
								type="button"
								onClick={() => handleSubmitCredentials(userBotpressToken, userBotpressURL)}
							>
								<span className="text-lg text-white font-medium">
									Salvar Credenciais
								</span>
							</button>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
