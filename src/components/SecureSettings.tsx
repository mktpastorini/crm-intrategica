
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { inputValidation } from '@/utils/inputValidation';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SecureSettingsProps {
  title: string;
  description: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'email';
    required?: boolean;
    sensitive?: boolean;
  }[];
  values: Record<string, string>;
  onSave: (values: Record<string, string>) => Promise<void>;
}

export default function SecureSettings({ title, description, fields, values, onSave }: SecureSettingsProps) {
  const [formData, setFormData] = useState<Record<string, string>>(values);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const { isAuthenticated, hasRequiredRole, isLoading } = useAuthCheck({ 
    requiredRole: ['admin'] 
  });

  useEffect(() => {
    setFormData(values);
  }, [values]);

  const validateField = (key: string, value: string): string | null => {
    const field = fields.find(f => f.key === key);
    if (!field) return null;

    if (field.required && !inputValidation.validateRequired(value)) {
      return `${field.label} é obrigatório`;
    }

    switch (field.type) {
      case 'email':
        if (value && !inputValidation.validateEmail(value)) {
          return 'Email inválido';
        }
        break;
      case 'url':
        if (value && !inputValidation.validateUrl(value)) {
          return 'URL inválida';
        }
        break;
    }

    return null;
  };

  const handleInputChange = (key: string, value: string) => {
    const sanitizedValue = inputValidation.sanitizeHtml(value);
    setFormData(prev => ({ ...prev, [key]: sanitizedValue }));
    
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasRequiredRole) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para salvar essas configurações",
        variant: "destructive",
      });
      return;
    }

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field.key, formData[field.key] || '');
      if (error) {
        newErrors[field.key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Erro de validação",
        description: "Corrija os erros no formulário antes de continuar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Carregando configurações..." />;
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Acesso Restrito</h3>
          <p className="text-slate-600">Você precisa ser administrador para acessar essas configurações.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id={field.key}
                  type={
                    field.sensitive && !showSensitive[field.key] 
                      ? 'password' 
                      : field.type === 'password' ? 'text' : field.type
                  }
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className={errors[field.key] ? 'border-red-500' : ''}
                  required={field.required}
                />
                {field.sensitive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                    onClick={() => toggleSensitiveVisibility(field.key)}
                  >
                    {showSensitive[field.key] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              {errors[field.key] && (
                <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>
              )}
            </div>
          ))}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
