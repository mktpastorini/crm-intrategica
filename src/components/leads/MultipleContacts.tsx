
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Phone, Mail, User } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  position?: string;
}

interface MultipleContactsProps {
  contacts: Contact[];
  onChange: (contacts: Contact[]) => void;
}

export default function MultipleContacts({ contacts, onChange }: MultipleContactsProps) {
  const addContact = () => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      position: ''
    };
    onChange([...contacts, newContact]);
  };

  const removeContact = (contactId: string) => {
    onChange(contacts.filter(contact => contact.id !== contactId));
  };

  const updateContact = (contactId: string, field: keyof Contact, value: string) => {
    onChange(
      contacts.map(contact =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Contatos</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addContact}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Contato
        </Button>
      </div>

      <div className="space-y-3">
        {contacts.map((contact, index) => (
          <Card key={contact.id} className="border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {index === 0 ? 'Contato Principal' : `Contato ${index + 1}`}
                </CardTitle>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContact(contact.id)}
                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`contact-name-${contact.id}`} className="flex items-center gap-2 text-sm">
                    <User className="w-3 h-3" />
                    Nome do Contato
                  </Label>
                  <Input
                    id={`contact-name-${contact.id}`}
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`contact-position-${contact.id}`} className="text-sm">
                    Cargo/Posição
                  </Label>
                  <Input
                    id={`contact-position-${contact.id}`}
                    value={contact.position || ''}
                    onChange={(e) => updateContact(contact.id, 'position', e.target.value)}
                    placeholder="Ex: Gerente, Diretor..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`contact-phone-${contact.id}`} className="flex items-center gap-2 text-sm">
                    <Phone className="w-3 h-3" />
                    Telefone
                  </Label>
                  <Input
                    id={`contact-phone-${contact.id}`}
                    value={contact.phone}
                    onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`contact-email-${contact.id}`} className="flex items-center gap-2 text-sm">
                    <Mail className="w-3 h-3" />
                    Email
                  </Label>
                  <Input
                    id={`contact-email-${contact.id}`}
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                    placeholder="contato@empresa.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg">
          <p className="text-sm">Nenhum contato adicionado</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addContact}
            className="mt-2"
          >
            Adicionar Primeiro Contato
          </Button>
        </div>
      )}
    </div>
  );
}
