import robotFaceIcon from '../../assets/robot-face-icon.png';

interface HeaderProps {
	handleLogout: () => void;
	botName?: string;
	className?: string;
}

export function Header({ handleLogout, botName, className }: HeaderProps) {
	return (
		<div
			className={`overflow-hidden rounded-lg shadow-lg bg-white ${className}`}
		>
			<div className="bg-gradient-to-r from-purple-900 to-purple-500 p-4">
				<div className="grid grid-cols-3 items-center">
					{/* Lado esquerdo */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
							<img
								src={robotFaceIcon}
								alt="Robot face icon"
								className="w-6 h-6"
							/>
						</div>
						<div className="px-3 py-1 text-sm bg-white/20 text-white rounded-full">
							{botName || 'Unnamed bot'}
						</div>
					</div>

					{/* Logo centralizado */}
					<div className="flex justify-center">
						<img 
							src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=414,fit=crop,q=95/Yyv7aOk2ByFveyrm/logocerta-Aq2o8LokE3TRO3Oq.png"
							alt="Logo"
							className="h-12 w-auto"
						/>
					</div>

					{/* Lado direito */}
					<div className="flex items-center gap-4 justify-end">
						<button className="text-white hover:bg-white/20 px-4 py-2 rounded-full transition-colors">
							Conversations
						</button>
						<button
							className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors"
							onClick={() => handleLogout()}
						>
							Logout
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
