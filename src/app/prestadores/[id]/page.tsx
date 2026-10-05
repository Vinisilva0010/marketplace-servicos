import { eq } from "drizzle-orm";
import { db } from "@/db";
import { prestadores, usuarios } from "@/db/schema";
import ChamarProfissional from "./chamar";
import {
  buscarServicosDoPrestador, buscarCidadesDoPrestador,
  buscarAvaliacoesDoPrestador, mediaDoPrestador,
} from "@/db/perfil";

export const dynamic = "force-dynamic";

export default async function PerfilPublico({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ convite?: string }>;
}) {
  const { id } = await params;
  const parametros = await searchParams;
  const prestadorId = Number(id);

  const achados = await db
    .select({
      id: prestadores.id,
      nome: usuarios.nome,
      telefone: usuarios.telefone,
      apresentacao: prestadores.apresentacao,
      anosExperiencia: prestadores.anosExperiencia,
      verificado: prestadores.verificado,
      tipoPessoa: prestadores.tipoPessoa,
      razaoSocial: prestadores.razaoSocial,
    })
    .from(prestadores)
    .innerJoin(usuarios, eq(usuarios.id, prestadores.usuarioId))
    .where(eq(prestadores.id, prestadorId));

  const prestador = achados[0];

  if (!prestador) {
    return (
      <div>
        <h2>Prestador não encontrado</h2>
        <p className="aviso">Este prestador não existe ou foi removido.</p>
        <ChamarProfissional prestadorId={prestador.id} prestadorNome={prestador.nome} />

      <p><a href="/prestadores">Voltar para a busca</a></p>
      </div>
    );
  }

  const [servicos, cidadesAtuacao, listaAvaliacoes, media] = await Promise.all([
    buscarServicosDoPrestador(prestador.id),
    buscarCidadesDoPrestador(prestador.id),
    buscarAvaliacoesDoPrestador(prestador.id),
    mediaDoPrestador(prestador.id),
  ]);

  return (
    <div>
      <h2>{prestador.nome}</h2>

      {parametros.convite === "1" && (
        <p className="aviso">
          Convite enviado. Este profissional vai ver o seu pedido em destaque e
          pode enviar uma proposta.
        </p>
      )}

      <p>
        <label>Avaliação</label>
        {media && Number(media.total) > 0
          ? `${media.media} de 5, com base em ${media.total} avaliação(ões)`
          : "Ainda não recebeu avaliações"}
      </p>
      <p>
        <label>Experiência</label>
        {prestador.anosExperiencia} anos
      </p>
      <p>
        <label>Situação do cadastro</label>
        {prestador.verificado ? "Verificado pela plataforma" : "Não verificado"}
      </p>
      {prestador.tipoPessoa === "juridica" && (
        <p>
          <label>Empresa</label>
          {prestador.razaoSocial}
        </p>
      )}
      <p>
        <label>Telefone</label>
        {prestador.telefone}
      </p>

      <h3>Apresentação</h3>
      <p>{prestador.apresentacao}</p>

      <h3>Serviços oferecidos</h3>
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Preço</th>
          </tr>
        </thead>
        <tbody>
          {servicos.map((servico) => (
            <tr key={servico.id}>
              <td>{servico.titulo}</td>
              <td>{servico.categoria}</td>
              <td>{servico.descricao}</td>
              <td>R$ {servico.precoBase} por {servico.unidadePreco}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Cidades atendidas</h3>
      <p>
        {cidadesAtuacao.map((cidade) => `${cidade.nome} - ${cidade.estado}`).join(", ")}
      </p>

      <h3>Avaliações de clientes</h3>
      {listaAvaliacoes.length === 0 ? (
        <p className="aviso">Este prestador ainda não recebeu avaliações.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Cliente</th>
              <th>Nota</th>
              <th>Comentário</th>
              <th>Resposta do prestador</th>
            </tr>
          </thead>
          <tbody>
            {listaAvaliacoes.map((avaliacao) => (
              <tr key={avaliacao.id}>
                <td>{avaliacao.servico}</td>
                <td>{avaliacao.autor}</td>
                <td>{avaliacao.nota} de 5</td>
                <td>{avaliacao.comentario}</td>
                <td>{avaliacao.respostaPrestador}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ChamarProfissional prestadorId={prestador.id} prestadorNome={prestador.nome} />

      <p><a href="/prestadores">Voltar para a busca</a></p>
    </div>
  );
}
