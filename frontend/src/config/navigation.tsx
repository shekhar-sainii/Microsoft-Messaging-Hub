import { Layout as LayoutIcon, PenTool, Settings, MessageSquare, Shield, Zap, Globe, History, Library, CalendarClock, LayoutGrid } from "lucide-react";
import { Dashboard } from "../features/dashboard/components/Dashboard";
import { BuilderLayout } from "../features/builder/components/BuilderLayout";
import { AdminDashboard } from "../features/admin/components/AdminDashboard";
import { HistoryList } from "../features/history/components/HistoryList";
import { TemplateLibrary } from "../features/templates/components/TemplateLibrary";
import { SchedulerDashboard } from "../features/scheduler/components/SchedulerDashboard";
import { WorkspacePage } from "../pages/WorkspacePage";

export const NAVIGATION_TABS = [
  { 
    id: 'dashboard', 
    icon: LayoutIcon, 
    label: 'Dash',
    title: 'Dashboard',
    path: '/dashboard',
    description: 'Overview of your Teams activities and metrics.',
    component: Dashboard,
    roles: ['user', 'admin']
  },
  {
    id: 'workspace',
    icon: LayoutGrid,
    label: 'Teams',
    title: 'Organization Workspace',
    path: '/workspace',
    description: 'Real-time messaging and channel management.',
    component: WorkspacePage,
    roles: ['user', 'admin']
  },
  {
    id: 'history',
    icon: History,
    label: 'History',
    title: 'Message History',
    path: '/history',
    description: 'Review and manage your sent communications.',
    component: HistoryList,
    roles: ['user', 'admin']
  },
  {
    id: 'templates',
    icon: Library,
    label: 'Templates',
    title: 'Template Library',
    path: '/templates',
    description: 'Manage reusable message layouts and adaptive cards.',
    component: TemplateLibrary,
    roles: ['user', 'admin']
  },
  {
    id: 'scheduler',
    icon: CalendarClock,
    label: 'Scheduler',
    title: 'Scheduled Messages',
    path: '/scheduler',
    description: 'Manage messages queued for future delivery.',
    component: SchedulerDashboard,
    roles: ['user', 'admin']
  },
  { 
    id: 'builder', 
    icon: PenTool, 
    label: 'Designer',
    title: 'Adaptive Card Builder',
    path: '/builder',
    description: 'Design complex interactive experiences for Teams.',
    component: BuilderLayout,
    roles: ['user', 'admin']
  },
  { 
    id: 'admin', 
    icon: Settings, 
    label: 'Admin',
    title: 'Admin Command Center',
    path: '/admin',
    description: 'System orchestration, audit trails, and security settings.',
    component: AdminDashboard,
    roles: ['admin'] // Strictly admin only
  }
] as const;

export type TabId = typeof NAVIGATION_TABS[number]['id'];

export const SPLASH_FEATURES = [
  { icon: Shield, text: "Enterprise Security", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Zap, text: "Real-time Synchronization", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Globe, text: "Global Multi-tenant Support", color: "text-indigo-600", bg: "bg-indigo-50" }
];
