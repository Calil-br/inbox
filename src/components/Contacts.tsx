import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown, FiChevronUp, FiUser } from 'react-icons/fi';
import { LoadingAnimation } from './interface/Loading';

// Interface para o tipo Contact
export interface Contact {
  id: string;
  name: string;
  phone?: string;
  about?: string;
}

// Interface para as props do componente
interface ContactsProps {
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
  className?: string;
  isLoading?: boolean;
}

export const Contacts: React.FC<ContactsProps> = ({
  contacts,
  onSelectContact,
  className = '',
  isLoading = false
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);

  // Função de debounce para a busca
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Filtragem dos contatos
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  );

  return (
    <motion.div 
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-500 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiUser className="text-2xl" />
          Contatos
        </h2>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          {isMinimized ? <FiChevronDown /> : <FiChevronUp />}
        </button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* Campo de busca */}
            <div className="p-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar contato..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border rounded-full
                    focus:ring-2 focus:ring-purple-300 focus:border-purple-300 
                    outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Lista de contatos */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 flex justify-center">
                  <LoadingAnimation label="Carregando contatos..." />
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredContacts.map(contact => (
                    <motion.div
                      key={contact.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors
                        ${hoveredContact === contact.id ? 'bg-gray-50' : ''}`}
                      onClick={() => onSelectContact(contact.id)}
                      onHoverStart={() => setHoveredContact(contact.id)}
                      onHoverEnd={() => setHoveredContact(null)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-900 to-purple-500 flex items-center justify-center text-white font-bold">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{contact.name}</h3>
                          {contact.phone && (
                            <p className="text-sm text-gray-500">{contact.phone}</p>
                          )}
                        </div>
                      </div>
                      {contact.about && (
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {contact.about}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Nenhum contato encontrado
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
