/**
 * Icon Registry — Maps string icon names to lucide-react components
 *
 * Used by the Sidebar to render plugin nav icons from manifest data
 * (which contains icon names as strings, not component references).
 */

import {
  Disc3,
  CalendarDays,
  User,
  Camera,
  Mail,
  Inbox,
  MessageSquare,
  FileText,
  Image,
  Globe,
  Palette,
  Settings,
  LayoutDashboard,
  Music,
  Rss,
  Search,
  Plus,
  Puzzle,
  ShoppingBag,
  Receipt,
  CreditCard,
  Shirt,
  CalendarCheck,
  Clock,
  FolderTree,
  MessageCircle,
  Activity,
  FlaskConical,
  Upload,
  Webhook,
  Languages,
  History,
  ScanLine,
  UserPlus,
  Radio,
  Bot,
  Megaphone,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  Disc3,
  CalendarDays,
  User,
  Camera,
  Mail,
  Inbox,
  MessageSquare,
  FileText,
  Image,
  Globe,
  Palette,
  Settings,
  LayoutDashboard,
  Music,
  Rss,
  Search,
  Plus,
  Puzzle,
  ShoppingBag,
  Receipt,
  CreditCard,
  Shirt,
  CalendarCheck,
  Clock,
  FolderTree,
  MessageCircle,
  Activity,
  FlaskConical,
  Upload,
  Webhook,
  Languages,
  History,
  ScanLine,
  UserPlus,
  Radio,
  Bot,
  Megaphone,
  HelpCircle,
};

/**
 * Look up a lucide-react icon component by name.
 * Falls back to the Puzzle icon if not found.
 */
export function getIcon(name: string): LucideIcon {
  return icons[name] || Puzzle;
}
