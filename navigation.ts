import {
  LayoutDashboard,
  Cpu,
  Zap,
  Leaf,
  Package,
  Truck,
  Wallet,
  ScrollText,
  Bot,
  FlaskConical,
  FileBarChart,
  Settings,
} from 'lucide-react';
import type { PageKey } from '@/types';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  group: 'overview' | 'operations' | 'intelligence' | 'admin';
  badge?: string;
}

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'overview' },
  { key: 'machine-health', label: 'Machine Health AI', icon: Cpu, group: 'operations', badge: 'AI' },
  { key: 'energy-optimization', icon: Zap, label: 'Energy Optimization', group: 'operations' },
  { key: 'energy-ledger', icon: Leaf, label: 'Energy & Carbon Ledger', group: 'operations' },
  { key: 'inventory', icon: Package, label: 'Inventory', group: 'operations' },
  { key: 'suppliers', icon: Truck, label: 'Supplier Intelligence', group: 'operations' },
  { key: 'finance', icon: Wallet, label: 'Finance', group: 'operations' },
  { key: 'audit-log', icon: ScrollText, label: 'Audit Log', group: 'admin' },
  { key: 'ai-assistant', icon: Bot, label: 'AI Business Assistant', group: 'intelligence', badge: 'AI' },
  { key: 'simulator', icon: FlaskConical, label: 'What-if Simulator', group: 'intelligence' },
  { key: 'reports', icon: FileBarChart, label: 'Reports', group: 'admin' },
  { key: 'settings', icon: Settings, label: 'Settings', group: 'admin' },
];

export const navGroups: Record<NavItem['group'], string> = {
  overview: 'Overview',
  operations: 'Operations',
  intelligence: 'Intelligence',
  admin: 'Administration',
};
