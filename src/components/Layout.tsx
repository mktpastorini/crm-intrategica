
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Users,
  MessageSquare,
  Settings,
  GitBranch,
  Route,
  BarChart3,
  Eye,
  UserPlus,
  LogOut,
  Activity,
  User,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, logout } = useAuth();
  const { settings } = useSystemSettingsDB();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Agenda', href: '/calendar', icon: Calendar },
    { name: 'Leads', href: '/leads', icon: UserPlus },
    { name: 'Pipeline', href: '/pipeline', icon: GitBranch },
    { name: 'Mensagens', href: '/messages', icon: MessageSquare },
    { name: 'Jornada do Cliente', href: '/customer-journey', icon: Route },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Supervisão', href: '/supervision', icon: Eye },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf9fb' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {settings.logoUrl && (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="h-8 w-auto object-contain" 
                  data-logo 
                />
              )}
              {settings.systemName && (
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    {settings.systemName}
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Activity className="w-4 h-4" />
                <span>Sistema ativo</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback style={{ backgroundColor: settings.primaryColor, color: 'white' }}>
                        {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {profile?.name || user?.email?.split('@')[0] || 'Usuário'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {profile?.role || 'Usuário'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-slate-200 min-h-screen shadow-sm">
          <div className="p-6">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-white border'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    style={active ? { 
                      backgroundColor: settings.primaryColor,
                      borderColor: settings.primaryColor 
                    } : {}}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
