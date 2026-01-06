import type { Metadata } from "next";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const metadata: Metadata = {
  title: "Administration - Genova",
  description: "Interface d'administration de la plateforme Genova",
};

const sidebarItems: SidebarItem[] = [
  {
    title: "Tableau de bord",
    href: "/admin",
    icon: "LayoutDashboard",
  },
  {
    title: "Utilisateurs",
    href: "/admin/users",
    icon: "Users",
  },
  {
    title: "Tuteurs",
    href: "/admin/tutors",
    icon: "GraduationCap",
  },
  {
    title: "Étudiants",
    href: "/admin/students",
    icon: "UserCheck",
  },
  {
    title: "Sessions",
    href: "/admin/sessions",
    icon: "Calendar",
  },
  {
    title: "Rapports",
    href: "/admin/reports",
    icon: "BarChart3",
  },
  {
    title: "Configuration",
    href: "/admin/settings",
    icon: "Settings",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="flex min-h-screen bg-cream">
        <Sidebar title="Administration" items={sidebarItems} variant="admin" />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
