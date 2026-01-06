import type { Metadata } from "next";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const metadata: Metadata = {
  title: "Espace Tuteur - Genova",
  description: "Interface tuteur de la plateforme Genova",
};

const sidebarItems: SidebarItem[] = [
  {
    title: "Tableau de bord",
    href: "/tutor",
    icon: "Home",
  },
  {
    title: "Mes sessions",
    href: "/tutor/sessions",
    icon: "Calendar",
  },
  {
    title: "Mes étudiants",
    href: "/tutor/students",
    icon: "Users",
  },
  {
    title: "Mon planning",
    href: "/tutor/schedule",
    icon: "Clock",
  },
  {
    title: "Mes revenus",
    href: "/tutor/earnings",
    icon: "DollarSign",
  },
  {
    title: "Mon profil",
    href: "/tutor/profile",
    icon: "User",
  },
];

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <div className="flex min-h-screen bg-cream">
        <Sidebar title="Espace Tuteur" items={sidebarItems} variant="tutor" />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
