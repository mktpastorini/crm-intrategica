
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  MessageCircle, 
  GitBranch,
  UserCheck,
  UserPlus,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Layout() {
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: BarChart3, label: 'Dashboard', roles: ['admin', 'supervisor', 'comercial'] },
    { path: '/leads', icon: Users, label: 'Leads', roles: ['admin', 'supervisor', 'comercial'] },
    { path: '/pipeline', icon: GitBranch, label: 'Pipeline', roles: ['admin', 'supervisor', 'comercial'] },
    { path: '/messages', icon: MessageCircle, label: 'Mensagens', roles: ['admin', 'supervisor', 'comercial'] },
    { path: '/calendar', icon: Calendar, label: 'Agenda', roles: ['admin', 'supervisor', 'comercial'] },
    { path: '/supervision', icon: UserCheck, label: 'Supervisão', roles: ['admin', 'supervisor'] },
    { path: '/users', icon: UserPlus, label: 'Usuários', roles: ['admin'] },
    { path: '/settings', icon: Settings, label: 'Configurações', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !profile || item.roles.includes(profile.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'comercial':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-bold text-white text-lg hidden md:block">CRM</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {profile?.name || user?.email}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      {profile && (
                        <Badge className={`text-xs ${getRoleColor(profile.role)}`}>
                          {profile.role === 'admin' ? 'Admin' : 
                           profile.role === 'supervisor' ? 'Supervisor' : 'Comercial'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActive(item.path) 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
