
import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Workflow,
  MessageSquare,
  Calendar,
  Shield,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/', roles: ['admin', 'supervisor', 'comercial'] },
  { id: 'leads', label: 'Leads', icon: Users, path: '/leads', roles: ['admin', 'supervisor', 'comercial'] },
  { id: 'pipeline', label: 'Atendimento', icon: Workflow, path: '/pipeline', roles: ['admin', 'supervisor', 'comercial'] },
  { id: 'messages', label: 'Mensagens', icon: MessageSquare, path: '/messages', roles: ['admin', 'supervisor', 'comercial'] },
  { id: 'calendar', label: 'Agenda', icon: Calendar, path: '/calendar', roles: ['admin', 'supervisor', 'comercial'] },
  { id: 'supervision', label: 'Supervisão', icon: Shield, path: '/supervision', roles: ['admin', 'supervisor'] },
  { id: 'users', label: 'Usuários', icon: UserCog, path: '/users', roles: ['admin'] },
  { id: 'settings', label: 'Ajustes', icon: Settings, path: '/settings', roles: ['admin'] },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'comercial')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AgencyCRM
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-slate-100",
                    isActive && "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 text-blue-700"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-600")} />
                  <span className={cn("font-medium", isActive ? "text-blue-700" : "text-slate-700")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-slate-900">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Bem-vindo, {user?.name}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
