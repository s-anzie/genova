import type { Metadata } from "next";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const metadata: Metadata = {
  title: "Espace Étudiant - Genova",
  description: "Interface étudiant de la plateforme Genova",
};

const sidebarItems: SidebarItem[] = [
  {
    title: "Tableau de bord",
    href: "/student",
    icon: "Home",
  },
  {
    title: "Mes sessions",
    href: "/student/sessions",
    icon: "Calendar",
  },
  {
    title: "Mes tuteurs",
    href: "/student/tutors",
    icon: "GraduationCap",
  },
  {
    title: "Mon planning",
    href: "/student/schedule",
    icon: "Clock",
  },
  {
    title: "Ma progression",
    href: "/student/progress",
    icon: "TrendingUp",
  },
  {
    title: "Mon profil",
    href: "/student/profile",
    icon: "User",
  },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="flex min-h-screen bg-cream">
        <Sidebar title="Espace Étudiant" items={sidebarItems} variant="student" />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
