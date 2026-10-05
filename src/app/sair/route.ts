import { NextResponse } from "next/server";
import { encerrarSessao } from "@/lib/sessao";

export async function GET(request: Request) {
  await encerrarSessao();
  return NextResponse.redirect(new URL("/", request.url));
}
