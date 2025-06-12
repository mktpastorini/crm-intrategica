
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { usePhoneMask } from '@/hooks/usePhoneMask';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  status: string;
  created_at: string;
  updated_at: string;
  responsible_id: string;
  last_contact: string | null;
  source: string;
  website: string;
  address: string;
  niche: string;
  pipeline_stage: string | null;
  rating: number | null;
  place_id: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSave: (data: Partial<Lead>) => Promise<{ success: boolean; error?: any }>;
  onClose: () => void;
  users: User[];
}

export default function LeadDialog({ open, onOpenChange, lead, onSave, onClose, users }: LeadDialogProps) {
  const { handlePhoneChange } = usePhoneMask();
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    status: 'novo',
    responsible_id: '',
    source: '',
    website: '',
    address: '',
    niche: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        whatsapp: lead.whatsapp || '',
        status: lead.status || 'novo',
        responsible_id: lead.responsible_id || '',
        source: lead.source || '',
        website: lead.website || '',
        address: lead.address || '',
        niche: lead.niche || ''
      });
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        whatsapp: '',
        status: 'novo',
        responsible_id: '',
        source: '',
        website: '',
        address: '',
        niche: ''
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await onSave(formData);
    
    if (result.success) {
      onOpenChange(false);
      onClose();
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {lead ? 'Editar Lead' : 'Novo Lead'}
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value, (value) => 
                  setFormData({ ...formData, phone: value })
                )}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handlePhoneChange(e.target.value, (value) => 
                  setFormData({ ...formData, whatsapp: value })
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contato">Em Contato</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="responsible">Responsável *</Label>
              <Select value={formData.responsible_id} onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="niche">Nicho *</Label>
              <Input
                id="niche"
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="source">Origem</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
