
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileText, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface MessageTemplatesProps {
  currentMessage: string;
  onTemplateLoad: (content: string) => void;
}

export default function MessageTemplates({ currentMessage, onTemplateLoad }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const { toast } = useToast();

  // Carregar templates do localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('messageTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Salvar templates no localStorage
  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    localStorage.setItem('messageTemplates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o template",
        variant: "destructive",
      });
      return;
    }

    if (!currentMessage.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Não é possível salvar um template sem conteúdo",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      content: currentMessage,
      createdAt: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);

    toast({
      title: "Template salvo",
      description: `Template "${templateName}" foi salvo com sucesso`,
    });

    setTemplateName('');
    setShowSaveDialog(false);
  };

  const handleLoadTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      onTemplateLoad(template.content);
      toast({
        title: "Template carregado",
        description: `Template "${template.name}" foi carregado`,
      });
      setShowLoadDialog(false);
      setSelectedTemplate('');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(updatedTemplates);
      
      toast({
        title: "Template excluído",
        description: `Template "${template.name}" foi excluído`,
      });
      
      if (selectedTemplate === templateId) {
        setSelectedTemplate('');
      }
    }
  };

  return (
    <div className="flex gap-2">
      {/* Salvar Template */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" type="button">
            <Save className="w-4 h-4 mr-1" />
            Salvar Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Template</DialogTitle>
            <DialogDescription>
              Salve a mensagem atual como um template para reutilizar depois
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Apresentação comercial"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} className="flex-1">
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Carregar Template */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" type="button" disabled={templates.length === 0}>
            <FileText className="w-4 h-4 mr-1" />
            Carregar Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregar Template</DialogTitle>
            <DialogDescription>
              Selecione um template salvo para carregar na mensagem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-select">Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <Label className="text-sm font-medium">Preview:</Label>
                <p className="text-sm text-slate-600 mt-1">
                  {templates.find(t => t.id === selectedTemplate)?.content.slice(0, 200)}
                  {templates.find(t => t.id === selectedTemplate)?.content.length > 200 ? '...' : ''}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleLoadTemplate} 
                className="flex-1"
                disabled={!selectedTemplate}
              >
                <FileText className="w-4 h-4 mr-1" />
                Carregar
              </Button>
              <Button variant="outline" onClick={() => setShowLoadDialog(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
