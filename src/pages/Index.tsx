
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, LayoutDashboard } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Bem vindo à Intratégica</h1>
        <p className="text-xl text-gray-600 mb-8">Sistema de Gestão Comercial</p>
        
        <div className="space-y-4">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="w-full max-w-xs">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Ir para Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="lg" className="w-full max-w-xs">
                <LogIn className="w-4 h-4 mr-2" />
                Fazer Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
