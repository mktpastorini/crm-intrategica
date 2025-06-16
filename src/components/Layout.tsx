import {
  BarChart3,
  Calendar,
  FileText,
  GitBranch,
  LayoutDashboard,
  MessageCircle,
  Settings,
  User,
  Users,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModeToggle } from '@/components/ModeToggle';

const sidebarItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Pipeline', href: '/pipeline', icon: GitBranch },
  { name: 'Propostas', href: '/proposals', icon: FileText },
  { name: 'Mensagens', href: '/messages', icon: MessageCircle },
  { name: 'Calendário', href: '/calendar', icon: Calendar },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, logout } = useAuth();

  useEffect(() => {
    console.log('Layout - Auth State:', { user, profile });
  }, [user, profile]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex-shrink-0 hidden md:block">
        <div className="flex flex-col h-full">
          <div className="p-4">
            <Link to="/" className="flex items-center space-x-2 font-semibold">
              <LayoutDashboard className="h-6 w-6" />
              <span>Intratégica</span>
            </Link>
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {sidebarItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
              {profile?.role === 'admin' && (
                <>
                  <Separator />
                  <Link
                    to="/users"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>Usuários</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </>
              )}
              {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
                <>
                  <Separator />
                  <Link
                    to="/supervision"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Supervisão</span>
                  </Link>
                  <Link
                    to="/customer-journey"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Jornada do Cliente</span>
                  </Link>
                </>
              )}
            </div>
          </ScrollArea>
          <Separator />
          <div className="p-4">
            <ModeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden fixed top-4 left-4 z-50">
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetHeader className="text-left">
            <SheetTitle>Intratégica</SheetTitle>
            <SheetDescription>
              Navegue pelo sistema
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {sidebarItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
              {profile?.role === 'admin' && (
                <>
                  <Separator />
                  <Link
                    to="/users"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>Usuários</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </>
              )}
              {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
                <>
                  <Separator />
                  <Link
                    to="/supervision"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Supervisão</span>
                  </Link>
                  <Link
                    to="/customer-journey"
                    className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Jornada do Cliente</span>
                  </Link>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
          <MainNav className="mx-6"/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 lg:h-10 lg:w-10 rounded-full">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                  <AvatarImage src={profile?.avatar_url || `https://avatar.vercel.sh/${user?.email}.png`} alt={user?.email || "Avatar"} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/profile">Perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
