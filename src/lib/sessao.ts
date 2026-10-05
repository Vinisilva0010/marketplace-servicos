import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";

const NOME_COOKIE = "sessao";

function assinar(valor: string) {
  const segredo = process.env.SESSION_SECRET ?? "";
  return createHmac("sha256", segredo).update(valor).digest("hex");
}

function conferirAssinatura(valor: string, assinatura: string) {
  const esperada = assinar(valor);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function criarSessao(usuarioId: number) {
  const valor = String(usuarioId);
  const cookieStore = await cookies();
  cookieStore.set(NOME_COOKIE, `${valor}.${assinar(valor)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_COOKIE);
}

export async function usuarioLogado() {
  const cookieStore = await cookies();
  const bruto = cookieStore.get(NOME_COOKIE)?.value;
  if (!bruto) return null;

  const [valor, assinatura] = bruto.split(".");
  if (!valor || !assinatura) return null;
  if (!conferirAssinatura(valor, assinatura)) return null;

  const achados = await db
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      tipo: usuarios.tipo,
    })
    .from(usuarios)
    .where(eq(usuarios.id, Number(valor)));

  return achados[0] ?? null;
}
