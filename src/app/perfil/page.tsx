import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import PerfilContratante from "./contratante";
import PerfilPrestador from "./prestador";

export const dynamic = "force-dynamic";

export default async function PaginaPerfil() {
  const logado = await usuarioLogado();

  if (!logado) {
    redirect("/entrar");
  }

  if (logado.tipo === "prestador") {
    return <PerfilPrestador usuarioId={logado.id} />;
  }

  return <PerfilContratante usuarioId={logado.id} />;
}
