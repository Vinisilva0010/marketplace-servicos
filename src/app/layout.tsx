import "./globals.css";
import { usuarioLogado } from "@/lib/sessao";
import { buscarPrestadorPorUsuario } from "@/db/perfil";
import { avisosContratante, avisosPrestador } from "@/db/avisos";

export const metadata = {
  title: "Marketplace de Serviços Gerais",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

function Contador({ valor }: { valor: number }) {
  if (valor === 0) return null;
  return <span className="contador">{valor}</span>;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioLogado();

  let avisosC = { mensagens: 0, propostas: 0, aConfirmar: 0, aAvaliar: 0 };
  let avisosP = { mensagens: 0, convites: 0, emAndamento: 0, avaliacoes: 0 };

  if (usuario?.tipo === "cliente") {
    avisosC = await avisosContratante(usuario.id);
  }

  if (usuario?.tipo === "prestador") {
    const prestador = await buscarPrestadorPorUsuario(usuario.id);
    if (prestador) {
      avisosP = await avisosPrestador(prestador.id, usuario.id);
    }
  }

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
                <a href="/solicitacoes?ver=meus">
                  Meus pedidos
                  <Contador valor={avisosC.propostas + avisosC.aConfirmar + avisosC.aAvaliar} />
                </a>
                <a href="/conversas">
                  Conversas
                  <Contador valor={avisosC.mensagens} />
                </a>
              </>
            )}

            {usuario?.tipo === "prestador" && (
              <>
                <a href="/solicitacoes">
                  Buscar pedidos
                  <Contador valor={avisosP.convites} />
                </a>
                <a href="/propostas">
                  Minhas propostas
                  <Contador valor={avisosP.emAndamento} />
                </a>
                <a href="/conversas">
                  Conversas
                  <Contador valor={avisosP.mensagens} />
                </a>
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
                  <Contador valor={usuario.tipo === "prestador" ? avisosP.avaliacoes : 0} />
                </a>
                <span className="nome-usuario">{usuario.nome}</span>
                <a href="/sair">Sair</a>
              </span>
            ) : (
              <span id="area-usuario">
                <a href="/entrar">Entrar</a>
                <a href="/cadastro?tipo=cliente">Criar cadastro</a>
              </span>
            )}
          </div>
          <div id="conteudo">{children}</div>
        </div>
      </body>
    </html>
  );
}
