import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { criarSessao } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ cadastrado?: string; erro?: string }>;
}) {
  const parametros = await searchParams;

  async function entrar(formulario: FormData) {
    "use server";

    const email = String(formulario.get("email")).trim();
    const senha = String(formulario.get("senha"));

    const achados = await db
      .select({ id: usuarios.id, senhaHash: usuarios.senhaHash, ativo: usuarios.ativo })
      .from(usuarios)
      .where(eq(usuarios.email, email));

    const usuario = achados[0];

    if (!usuario || !usuario.ativo) {
      redirect("/entrar?erro=1");
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaConfere) {
      redirect("/entrar?erro=1");
    }

    await criarSessao(usuario.id);
    redirect("/");
  }

  return (
    <div>
      <h2>Entrar</h2>

      {parametros.cadastrado === "1" && (
        <p className="aviso">Cadastro criado. Entre com seu email e senha.</p>
      )}

      {parametros.erro === "1" && (
        <p className="aviso">Email ou senha incorretos.</p>
      )}

      <form action={entrar}>
        <p>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />
        </p>
        <p>
          <label htmlFor="senha">Senha</label>
          <input type="password" id="senha" name="senha" required />
        </p>
        <p>
          <input type="submit" value="Entrar" />
        </p>
      </form>

      <p>
        Ainda não tem cadastro? <a href="/cadastro">Criar cadastro</a>
      </p>
    </div>
  );
}
