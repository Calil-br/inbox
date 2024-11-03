interface DisclaimerProps {
	full?: boolean;
}

export function Disclaimer({ full }: DisclaimerProps) {
	return (
		<div className="bg-white rounded-lg shadow-lg overflow-hidden">
			<div className="bg-gradient-to-r from-purple-900 to-purple-500 p-4">
				<h2 className="text-xl font-bold text-white flex items-center gap-2">
					Aviso
				</h2>
			</div>
			<div className="p-4">
				<p className="text-gray-700">
					{full && (
						<>
							Esta é uma ferramenta para visualizar suas conversas.
							<br />
						</>
					)}
					Desenvolvido por Veduc Digital
				</p>
			</div>
		</div>
	);
}
