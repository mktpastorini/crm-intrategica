import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  ChevronDown,
  Menu,
  FileText
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, signOut } = useAuth();
  const { settings, loading: settingsLoading } = useSystemSettingsDB();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Agenda', href: '/calendar', icon: Calendar },
    { name: 'Leads', href: '/leads', icon: UserPlus },
    { name: 'Pipeline', href: '/pipeline', icon: GitBranch },
    { name: 'Propostas', href: '/proposals', icon: FileText },
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
    signOut();
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  // Use default color if settings are still loading
  const primaryColor = settings.primaryColor || '#1d0029';

  const NavigationMenu = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`space-y-1 ${isMobile ? 'p-6' : 'p-6'}`}>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={isMobile ? handleMobileNavClick : undefined}
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'text-white border'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            style={active ? { 
              backgroundColor: primaryColor,
              borderColor: primaryColor 
            } : {}}
          >
            <Icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header fixo */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-50">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Menu hambúrguer - apenas mobile */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-white p-0">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center space-x-4 p-6 border-b">
                      {settings.logoUrl && (
                        <img 
                          src={settings.logoUrl} 
                          alt="Logo" 
                          className="h-8 w-auto object-contain" 
                          data-logo 
                        />
                      )}
                      {settings.systemName && (
                        <h1 className="text-lg font-semibold text-slate-900">
                          {settings.systemName}
                        </h1>
                      )}
                    </div>
                    <nav className="flex-1 overflow-y-auto">
                      <NavigationMenu isMobile={true} />
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo e nome do sistema */}
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
                  <h1 className="text-lg md:text-xl font-semibold text-slate-900">
                    {settings.systemName}
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
                <Activity className="w-4 h-4" />
                <span>Sistema ativo</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.name} />
                      ) : null}
                      <AvatarFallback style={{ backgroundColor: primaryColor, color: 'white' }}>
                        {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
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
                <DropdownMenuContent align="end" className="w-56 bg-white">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Perfil
                    </Link>
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

      <div className="flex flex-1 min-h-0">
        {/* Sidebar fixo - apenas desktop */}
        <nav className="hidden md:flex flex-shrink-0 w-64 bg-white border-r border-slate-200 shadow-sm overflow-y-auto">
          <NavigationMenu />
        </nav>

        {/* Main content com scroll */}
        <main className="flex-1 min-h-0 overflow-auto bg-slate-50">
          <div className="p-4 md:p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
