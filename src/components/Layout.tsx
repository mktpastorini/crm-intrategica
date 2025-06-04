
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings,
  LogOut,
  UserCheck,
  Target,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { SystemSettings } from '@/types/settings';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Carregar configurações do sistema
  useEffect(() => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      
      // Aplicar logo e favicon se configurados
      if (parsedSettings.logoUrl) {
        const logoElements = document.querySelectorAll('[data-logo]');
        logoElements.forEach(element => {
          if (element instanceof HTMLImageElement) {
            element.src = parsedSettings.logoUrl;
          }
        });
      }
      
      if (parsedSettings.faviconUrl) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = parsedSettings.faviconUrl;
      }
      
      // Aplicar cores personalizadas
      if (parsedSettings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', parsedSettings.primaryColor);
      }
      if (parsedSettings.secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', parsedSettings.secondaryColor);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: Target, label: 'Pipeline', path: '/pipeline' },
    { icon: Calendar, label: 'Agenda', path: '/calendar' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
    { icon: UserCheck, label: 'Usuários', path: '/users' },
    { icon: Users, label: 'Supervisão', path: '/supervision' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {settings?.logoUrl && (
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="w-8 h-8 object-contain" 
                data-logo
              />
            )}
            <h1 className="text-xl font-bold text-slate-900">
              {settings?.systemName || 'CRM System'}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white w-64 h-full shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                {settings?.logoUrl && (
                  <img 
                    src={settings.logoUrl} 
                    alt="Logo" 
                    className="w-8 h-8 object-contain" 
                    data-logo
                  />
                )}
                <h2 className="text-lg font-semibold text-slate-900">
                  {settings?.systemName || 'CRM System'}
                </h2>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r">
            <div className="flex items-center flex-shrink-0 px-4 pb-5">
              {settings?.logoUrl && (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="w-10 h-10 object-contain mr-3" 
                  data-logo
                />
              )}
              <h1 className="text-xl font-bold text-slate-900">
                {settings?.systemName || 'CRM System'}
              </h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="inline-block h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500">
                        <span className="flex h-full w-full items-center justify-center text-white text-sm font-medium">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                          {user?.name || 'Usuário'}
                        </p>
                        <p className="text-xs font-medium text-slate-500 group-hover:text-slate-700">
                          {user?.role || 'Usuário'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
