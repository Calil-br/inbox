import React, { useState } from 'react';
import defaultAvatarImg from '../assets/default-avatar.png';
import { LoadingAnimation } from './interface/Loading';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  about?: string;
}

interface ContactsProps {
  contacts: Contact[];
  onSelectContact: (contactId: string) => void;
  isLoading: boolean;
}

export const Contacts: React.FC<ContactsProps> = ({ contacts, onSelectContact, isLoading }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-md shadow-md overflow-hidden">
      <div className="p-2 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">Contatos</h2>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isMinimized ? 'Expandir' : 'Minimizar'}
        </button>
      </div>
      {!isMinimized && (
        <>
          <div className="p-2">
            <input
              type="text"
              placeholder="Buscar contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <LoadingAnimation label="Carregando contatos..." />
            </div>
          ) : filteredContacts.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <li
                  key={contact.id}
                  onClick={() => onSelectContact(contact.id)}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <img
                    src={defaultAvatarImg}
                    alt={`Avatar de ${contact.name}`}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    {contact.phone && (
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-center text-gray-500">Nenhum contato encontrado</p>
          )}
        </>
      )}
    </div>
  );
};
