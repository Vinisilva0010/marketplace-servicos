import "./globals.css";
import { usuarioLogado } from "@/lib/sessao";

export const metadata = {
  title: "Marketplace de Serviços Gerais",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioLogado();

  return (
    <html lang="pt-BR">
      <body>
        <div id="container">
          <div id="cabecalho">
            <h1>Marketplace de Serviços Gerais</h1>
          </div>
          <div id="menu">
            <a href="/">Início</a>
            <a href="/prestadores">Prestadores</a>
            <a href="/solicitacoes">Solicitações</a>
            <a href="/solicitacoes/nova">Publicar pedido</a>
            {usuario ? (
              <span id="area-usuario">
                <a href="/perfil">Meu perfil</a> {usuario.nome} <a href="/sair">Sair</a>
              </span>
            ) : (
              <span id="area-usuario">
                <a href="/entrar">Entrar</a>
                <a href="/cadastro">Criar cadastro</a>
              </span>
            )}
          </div>
          <div id="conteudo">{children}</div>
        </div>
      </body>
    </html>
  );
}
