import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Ce middleware sera utilisé pour protéger les routes et vérifier les rôles
// Pour l'instant, il laisse passer toutes les requêtes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TODO: Ajouter la logique d'authentification
  // 1. Vérifier si l'utilisateur est connecté
  // 2. Vérifier le rôle de l'utilisateur
  // 3. Rediriger si nécessaire

  // Exemple de logique future :
  // if (pathname.startsWith('/admin')) {
  //   const userRole = getUserRole(request);
  //   if (userRole !== 'admin') {
  //     return NextResponse.redirect(new URL('/unauthorized', request.url));
  //   }
  // }

  return NextResponse.next();
}

// Configuration des routes à protéger
export const config = {
  matcher: [
    '/admin/:path*',
    '/tutor/:path*',
    '/student/:path*',
  ],
};
