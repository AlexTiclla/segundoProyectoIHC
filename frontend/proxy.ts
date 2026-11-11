import { NextResponse, type NextRequest } from "next/server";

import { nombreCookie } from "@/lib/constantes";

export function proxy(peticion: NextRequest) {
  if (!peticion.cookies.has(nombreCookie)) {
    return NextResponse.redirect(new URL("/ingresar", peticion.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/inicio/:path*", "/historial/:path*", "/compartir/:path*", "/analitica/:path*"],
};