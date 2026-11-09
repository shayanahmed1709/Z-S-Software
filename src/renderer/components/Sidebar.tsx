import { useEffect, useState } from 'react';
import {
  ChartColumn as BarChart2,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Printer,
  Receipt,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { UserRole } from '../../shared/types';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface NavLinkItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: UserRole[];
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  children: NavLinkItem[];
}

type NavEntry = NavLinkItem | NavGroup;

const navigation: NavEntry[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'employee', 'salesperson'] },
  { label: 'Orders', to: '/orders', icon: ClipboardList, roles: ['admin', 'employee'] },
  { label: 'Clients', to: '/clients', icon: Users, roles: ['admin', 'employee', 'salesperson'] },
  {
    label: 'Inventory',
    icon: Package,
    roles: ['admin', 'employee'],
    children: [
      { label: 'Packaging Stock', to: '/inventory/packaging', icon: Package, roles: ['admin', 'employee'] },
      { label: 'Printing Stock', to: '/inventory/printing', icon: Printer, roles: ['admin', 'employee'] },
    ],
  },
  { label: 'Quotations', to: '/quotations', icon: FileText, roles: ['admin', 'employee', 'salesperson'] },
  { label: 'Invoices', to: '/invoices', icon: Receipt, roles: ['admin', 'employee', 'salesperson'] },
  { label: 'Letterhead', to: '/letterhead', icon: Mail, roles: ['admin', 'employee', 'salesperson'] },
  { label: 'Reports', to: '/reports', icon: BarChart2, roles: ['admin'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['admin'] },
  { label: 'User Management', to: '/users', icon: UserCog, roles: ['admin'] },
];

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

function linkClass(isActive: boolean): string {
  return [
    'flex items-center gap-3 border-l-[3px] px-4 py-2.5 text-sm transition-colors',
    isActive
      ? 'border-[#2563EB] bg-[#13283F] text-white'
      : 'border-transparent text-[#C5D0E0] hover:bg-[#122033] hover:text-white',
  ].join(' ');
}

function formatRole(role: UserRole): string {
  if (role === 'salesperson') return 'Salesperson';
  if (role === 'admin') return 'Admin';
  return 'Employee';
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inventoryActive = location.pathname.startsWith('/inventory');
  const [inventoryOpen, setInventoryOpen] = useState(inventoryActive);

  useEffect(() => {
    if (inventoryActive) {
      setInventoryOpen(true);
    }
  }, [inventoryActive]);

  if (!user) {
    return null;
  }

  const visible = navigation.filter((entry) => entry.roles.includes(user.role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col bg-[#0A1628] text-white">
      <div className="flex h-20 items-center justify-center border-b border-white/10 px-5">
        <Logo tone="white" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {visible.map((entry) => {
          if (isGroup(entry)) {
            return (
              <div key={entry.label}>
                <button
                  type="button"
                  onClick={() => setInventoryOpen((open) => !open)}
                  className={`flex w-full items-center gap-3 border-l-[3px] px-4 py-2.5 text-left text-sm transition-colors ${
                    inventoryActive
                      ? 'border-[#2563EB] bg-[#13283F] text-white'
                      : 'border-transparent text-[#C5D0E0] hover:bg-[#122033] hover:text-white'
                  }`}
                >
                  <entry.icon size={18} />
                  <span className="flex-1">{entry.label}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${inventoryOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {inventoryOpen
                  ? entry.children
                      .filter((child) => child.roles.includes(user.role))
                      .map((child) => (
                        <NavLink key={child.to} to={child.to} end className={({ isActive }) => linkClass(isActive)}>
                          <child.icon size={16} className="ml-6" />
                          <span>{child.label}</span>
                        </NavLink>
                      ))
                  : null}
              </div>
            );
          }

          const Icon = entry.icon;
          return (
            <NavLink key={entry.to} to={entry.to} end className={({ isActive }) => linkClass(isActive)}>
              <Icon size={18} />
              <span>{entry.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold">{user.name}</p>
        <span className="mt-2 inline-flex rounded-full bg-[#2563EB]/20 px-2 py-0.5 text-[11px] font-medium tracking-wide text-[#93C5FD] uppercase">
          {formatRole(user.role)}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-[#E2E8F0] transition hover:bg-[#13283F]"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
