import { usuarioLogado } from "@/lib/sessao";
import { contarPorCategoria } from "@/db/queries";
import { buscarPrestadorPorUsuario } from "@/db/perfil";
import { painelContratante, painelPrestador } from "@/db/paineis";
import { convitesDoPrestador } from "@/db/convites";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const logado = await usuarioLogado();

  if (logado?.tipo === "cliente") {
    return <PainelContratante usuarioId={logado.id} nome={logado.nome} />;
  }

  if (logado?.tipo === "prestador") {
    return <PainelPrestador usuarioId={logado.id} nome={logado.nome} />;
  }

  return <PaginaVisitante />;
}

async function PaginaVisitante() {
  const listaCategorias = await contarPorCategoria();

  return (
    <div>
      <h2>Encontre quem resolve, ou ofereça seu serviço</h2>

      <p>
        Aqui você descreve o serviço que precisa e recebe propostas de
        profissionais da sua cidade, com valor e prazo. Você compara as
        propostas, escolhe uma e paga pela plataforma. O valor só é repassado
        ao profissional depois que você confirmar que o serviço foi feito.
      </p>

      <h3>Preciso contratar um serviço</h3>
      <p>
        Crie seu cadastro, descreva o que precisa e espere as propostas
        chegarem. Você não paga nada para publicar um pedido.
      </p>
      <p>
        <a href="/cadastro?tipo=cliente">Criar cadastro para contratar</a>
      </p>

      <h3>Quero oferecer meus serviços</h3>
      <p>
        Cadastre o que você faz, seu preço e as cidades onde atende. Você
        recebe os pedidos abertos da sua área e envia propostas para os que
        quiser atender.
      </p>
      <p>
        <a href="/cadastro?tipo=prestador">Criar cadastro como profissional</a>
      </p>

      <h3>Serviços disponíveis</h3>
      <p>
        <a href="/prestadores">Ver todos os profissionais cadastrados</a>
      </p>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>O que inclui</th>
          </tr>
        </thead>
        <tbody>
          {listaCategorias.map((categoria) => (
            <tr key={categoria.id}>
              <td>
                <a href={`/prestadores?categoria=${categoria.id}`}>{categoria.nome}</a>
              </td>
              <td>{categoria.descricao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function PainelContratante({ usuarioId, nome }: { usuarioId: number; nome: string }) {
  const painel = await painelContratante(usuarioId);

  return (
    <div>
      <h2>Olá, {nome}</h2>

      {painel.total === 0 && (
        <p className="aviso">
          Você ainda não publicou nenhum pedido.{" "}
          <a href="/solicitacoes/nova">Publicar meu primeiro pedido</a>
        </p>
      )}

      <h3>Esperando você escolher uma proposta ({painel.aguardandoEscolha.length})</h3>
      {painel.aguardandoEscolha.length === 0 ? (
        <p>Nenhum pedido aberto no momento.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Categoria</th>
              <th>Propostas recebidas</th>
            </tr>
          </thead>
          <tbody>
            {painel.aguardandoEscolha.map((pedido) => (
              <tr key={pedido.id}>
                <td><a href={`/solicitacoes/${pedido.id}`}>{pedido.titulo}</a></td>
                <td>{pedido.categoria}</td>
                <td>{pedido.totalPropostas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Serviços em andamento ({painel.emAndamento.length})</h3>
      {painel.emAndamento.length === 0 ? (
        <p>Nenhum serviço em andamento.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Categoria</th>
              <th>O que fazer</th>
            </tr>
          </thead>
          <tbody>
            {painel.emAndamento.map((pedido) => (
              <tr key={pedido.id}>
                <td><a href={`/solicitacoes/${pedido.id}`}>{pedido.titulo}</a></td>
                <td>{pedido.categoria}</td>
                <td>Confirmar quando o serviço terminar</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Esperando sua avaliação ({painel.aguardandoAvaliacao.length})</h3>
      {painel.aguardandoAvaliacao.length === 0 ? (
        <p>Nenhum serviço esperando avaliação.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Categoria</th>
            </tr>
          </thead>
          <tbody>
            {painel.aguardandoAvaliacao.map((pedido) => (
              <tr key={pedido.id}>
                <td><a href={`/solicitacoes/${pedido.id}`}>{pedido.titulo}</a></td>
                <td>{pedido.categoria}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Concluídos ({painel.concluidos.length})</h3>
      {painel.concluidos.length === 0 ? (
        <p>Nenhum serviço concluído ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Categoria</th>
            </tr>
          </thead>
          <tbody>
            {painel.concluidos.map((pedido) => (
              <tr key={pedido.id}>
                <td><a href={`/solicitacoes/${pedido.id}`}>{pedido.titulo}</a></td>
                <td>{pedido.categoria}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p><a href="/solicitacoes/nova">Publicar novo pedido</a></p>
    </div>
  );
}

async function PainelPrestador({ usuarioId, nome }: { usuarioId: number; nome: string }) {
  const prestador = await buscarPrestadorPorUsuario(usuarioId);

  if (!prestador) {
    return (
      <div>
        <h2>Olá, {nome}</h2>
        <p className="aviso">
          Seu perfil de prestador não foi encontrado. <a href="/perfil">Abrir meu perfil</a>
        </p>
      </div>
    );
  }

  const painel = await painelPrestador(prestador.id);
  const convitesRecebidos = await convitesDoPrestador(prestador.id);
  const convitesAbertos = convitesRecebidos.filter((c) => c.status === "aberta");

  return (
    <div>
      <h2>Olá, {nome}</h2>

      <p>
        <label>A receber (serviços em andamento)</label>
        R$ {painel.aReceber.toFixed(2)}
      </p>
      <p>
        <label>Já recebido</label>
        R$ {painel.recebido.toFixed(2)}
      </p>
      <p>
        <label>Sua avaliação</label>
        {painel.avaliacao && Number(painel.avaliacao.total) > 0
          ? `${painel.avaliacao.media} de 5, com ${painel.avaliacao.total} avaliação(ões)`
          : "Nenhuma avaliação ainda"}
      </p>

      {painel.semCadastroCompleto && (
        <p className="aviso">
          Você precisa ter pelo menos um serviço e uma cidade cadastrados para
          receber pedidos. <a href="/perfil">Completar meu perfil</a>
        </p>
      )}

      {convitesAbertos.length > 0 && (
        <>
          <h3>Você foi chamado nestes pedidos ({convitesAbertos.length})</h3>
          <p>O contratante viu o seu perfil e chamou você diretamente.</p>
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Categoria</th>
                <th>Contratante</th>
                <th>Local</th>
                <th>Orçamento</th>
              </tr>
            </thead>
            <tbody>
              {convitesAbertos.map((convite) => (
                <tr key={convite.id}>
                  <td>
                    <a href={`/solicitacoes/${convite.solicitacaoId}`}>{convite.titulo}</a>
                  </td>
                  <td>{convite.categoria}</td>
                  <td>{convite.contratante}</td>
                  <td>{convite.bairro} - {convite.cidade}</td>
                  <td>{convite.orcamentoMaximo ? `R$ ${convite.orcamentoMaximo}` : "Não informado"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Pedidos novos para você ({painel.novosPedidos.length})</h3>
      <p>Pedidos abertos na sua categoria e na sua cidade onde você ainda não enviou proposta.</p>
      {painel.novosPedidos.length === 0 ? (
        <p>Nenhum pedido novo no momento.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Categoria</th>
              <th>Local</th>
              <th>Orçamento do contratante</th>
            </tr>
          </thead>
          <tbody>
            {painel.novosPedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td><a href={`/solicitacoes/${pedido.id}`}>{pedido.titulo}</a></td>
                <td>{pedido.categoria}</td>
                <td>{pedido.bairro} - {pedido.cidade}</td>
                <td>{pedido.orcamentoMaximo ? `R$ ${pedido.orcamentoMaximo}` : "Não informado"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Propostas esperando resposta ({painel.aguardandoResposta.length})</h3>
      {painel.aguardandoResposta.length === 0 ? (
        <p>Nenhuma proposta aguardando.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Contratante</th>
              <th>Meu valor</th>
            </tr>
          </thead>
          <tbody>
            {painel.aguardandoResposta.map((proposta) => (
              <tr key={proposta.id}>
                <td>
                  <a href={`/solicitacoes/${proposta.solicitacaoId}`}>
                    {proposta.solicitacaoTitulo}
                  </a>
                </td>
                <td>{proposta.contratante}</td>
                <td>R$ {proposta.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Serviços em andamento ({painel.emAndamento.length})</h3>
      {painel.emAndamento.length === 0 ? (
        <p>Nenhum serviço em andamento.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Contratante</th>
              <th>Valor</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {painel.emAndamento.map((proposta) => (
              <tr key={proposta.id}>
                <td>
                  <a href={`/solicitacoes/${proposta.solicitacaoId}`}>
                    {proposta.solicitacaoTitulo}
                  </a>
                </td>
                <td>{proposta.contratante}</td>
                <td>R$ {proposta.valor}</td>
                <td>{proposta.pagamentoStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Serviços concluídos ({painel.concluidos.length})</h3>
      {painel.concluidos.length === 0 ? (
        <p>Nenhum serviço concluído ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Contratante</th>
              <th>Valor</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {painel.concluidos.map((proposta) => (
              <tr key={proposta.id}>
                <td>
                  <a href={`/solicitacoes/${proposta.solicitacaoId}`}>
                    {proposta.solicitacaoTitulo}
                  </a>
                </td>
                <td>{proposta.contratante}</td>
                <td>R$ {proposta.valor}</td>
                <td>{proposta.pagamentoStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
