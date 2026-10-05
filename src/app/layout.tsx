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

            {!usuario && <a href="/prestadores">Buscar prestadores</a>}

            {usuario?.tipo === "cliente" && (
              <>
                <a href="/prestadores">Buscar prestadores</a>
                <a href="/solicitacoes/nova">Publicar pedido</a>
                <a href="/solicitacoes?ver=meus">Meus pedidos</a>
                <a href="/conversas">Conversas</a>
              </>
            )}

            {usuario?.tipo === "prestador" && (
              <>
                <a href="/solicitacoes">Buscar pedidos</a>
                <a href="/propostas">Minhas propostas</a>
                <a href="/conversas">Conversas</a>
              </>
            )}

            {usuario ? (
              <span id="area-usuario">
                <a href="/perfil" className="link-perfil">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="#ffffff">
                    <circle cx="8" cy="5" r="3.2" />
                    <path d="M8 9.5c-3.2 0-5.5 1.8-5.5 4v1h11v-1c0-2.2-2.3-4-5.5-4z" />
                  </svg>
                  Perfil
                </a>
                <span className="nome-usuario">{usuario.nome}</span>
                <a href="/sair">Sair</a>
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
