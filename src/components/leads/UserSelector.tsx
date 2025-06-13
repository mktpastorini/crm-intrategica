
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url?: string;
}

interface UserSelectorProps {
  users: User[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function UserSelector({ users, value, onValueChange, placeholder = "Selecionar responsável", disabled = false }: UserSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedUser = users.find(user => user.id === value);
  const activeUsers = users.filter(user => user.status === 'active');

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      supervisor: 'bg-blue-100 text-blue-700',
      comercial: 'bg-green-100 text-green-700'
    };
    
    const labels = {
      admin: 'Admin',
      supervisor: 'Supervisor',
      comercial: 'Comercial'
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Responsável</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between mt-1"
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              {selectedUser ? (
                <>
                  <Avatar className="w-6 h-6">
                    <AvatarImage 
                      src={selectedUser.avatar_url} 
                      alt={selectedUser.name}
                    />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedUser.name}</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">{placeholder}</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar responsável..." />
            <CommandList>
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
              <CommandGroup>
                {activeUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => {
                      onValueChange(user.id === value ? "" : user.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={user.avatar_url} 
                          alt={user.name}
                        />
                        <AvatarFallback className="text-sm bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                        <div className="mt-1">{getRoleBadge(user.role)}</div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
