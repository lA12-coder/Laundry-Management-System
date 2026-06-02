import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCog,
  Wallet,
  Settings,
  Bike,
  UserCheck,
  ScrollText,
  Shirt,
  ReceiptText,
  MessageSquareQuote,
} from "lucide-react";
import { Permission } from "../lib/rbac";

/**
 * Admin sidebar entries — filtered at render time; unauthorized items are
 * omitted from the DOM entirely (not merely hidden via CSS).
 */
export const ADMIN_NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
    permission: Permission.VIEW_ADMIN_SHELL,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    permission: Permission.MANAGE_ORDERS,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: UserCog,
    permission: Permission.MANAGE_USERS,
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: UserCheck,
    permission: Permission.MANAGE_CUSTOMERS,
  },
  {
    name: "Riders",
    href: "/admin/riders",
    icon: Bike,
    permission: Permission.MANAGE_RIDERS,
  },
  {
    name: "Partners",
    href: "/admin/partners",
    icon: Users,
    permission: Permission.MANAGE_PARTNERS,
  },
  {
    name: "Price matrix",
    href: "/admin/pricing",
    icon: Shirt,
    permission: Permission.VIEW_PRICING,
    readOnlyPermission: Permission.EDIT_PRICING,
  },
  {
    name: "Financials",
    href: "/admin/financials",
    icon: Wallet,
    permission: Permission.VIEW_FINANCIALS,
    readOnlyPermission: Permission.EDIT_FINANCIALS,
  },
  {
    name: "Subscriptions",
    href: "/admin/subscriptions",
    icon: ReceiptText,
    permission: Permission.MANAGE_SUBSCRIPTIONS,
  },
  {
    name: "Testimonials",
    href: "/admin/testimonials",
    icon: MessageSquareQuote,
    permission: Permission.MANAGE_TESTIMONIALS,
  },
  {
    name: "Audit Logs",
    href: "/admin/logs",
    icon: ScrollText,
    permission: Permission.VIEW_AUDIT_LOGS,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    permission: Permission.MANAGE_SETTINGS,
  },
];
