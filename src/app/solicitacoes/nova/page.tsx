import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { listarCategorias } from "@/db/queries";
import { buscarEnderecos } from "@/db/perfil";
import { criarSolicitacao } from "@/db/solicitacoes";

export const dynamic = "force-dynamic";

export default async function PaginaNovaSolicitacao() {
  const logado = await usuarioLogado();

  if (!logado) {
    redirect("/entrar");
  }

  if (logado.tipo !== "cliente") {
    return (
      <div>
        <h2>Publicar pedido</h2>
        <p className="aviso">
          Esta página é para clientes. Prestadores enviam propostas em pedidos já publicados.
        </p>
        <p><a href="/solicitacoes">Ver pedidos abertos</a></p>
      </div>
    );
  }

  const [listaCategorias, listaEnderecos] = await Promise.all([
    listarCategorias(),
    buscarEnderecos(logado.id),
  ]);

  if (listaEnderecos.length === 0) {
    return (
      <div>
        <h2>Publicar pedido</h2>
        <p className="aviso">
          Você precisa cadastrar um endereço antes de publicar um pedido, porque o
          prestador precisa saber onde o serviço vai ser feito.
        </p>
        <p><a href="/perfil">Cadastrar endereço no meu perfil</a></p>
      </div>
    );
  }

  async function publicar(formulario: FormData) {
    "use server";

    const atual = await usuarioLogado();
    if (!atual || atual.tipo !== "cliente") redirect("/entrar");

    const solicitacao = await criarSolicitacao({
      clienteId: atual.id,
      categoriaId: Number(formulario.get("categoriaId")),
      enderecoId: Number(formulario.get("enderecoId")),
      titulo: String(formulario.get("titulo")).trim(),
      descricao: String(formulario.get("descricao")).trim(),
      dataDesejada: String(formulario.get("dataDesejada")),
      orcamentoMaximo: String(formulario.get("orcamentoMaximo")),
    });

    redirect(`/solicitacoes/${solicitacao.id}`);
  }

  return (
    <div>
      <h2>Publicar pedido</h2>
      <p>
        Descreva o que você precisa. Prestadores da categoria escolhida vão
        enviar propostas com valor e prazo, e você escolhe uma.
      </p>

      <form action={publicar}>
        <p>
          <label htmlFor="categoriaId">Categoria</label>
          <select id="categoriaId" name="categoriaId" required>
            {listaCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="titulo">Título do pedido</label>
          <input type="text" id="titulo" name="titulo" placeholder="Trocar piso da sala" required />
        </p>
        <p>
          <label htmlFor="descricao">O que você precisa</label>
          <textarea
            id="descricao"
            name="descricao"
            placeholder="Explique o serviço, o tamanho do trabalho e o que já está pronto ou comprado."
            required
          ></textarea>
        </p>
        <p>
          <label htmlFor="enderecoId">Onde o serviço vai ser feito</label>
          <select id="enderecoId" name="enderecoId" required>
            {listaEnderecos.map((endereco) => (
              <option key={endereco.id} value={endereco.id}>
                {endereco.logradouro}, {endereco.numero} - {endereco.bairro} - {endereco.cidade}
              </option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="dataDesejada">Data desejada</label>
          <input type="date" id="dataDesejada" name="dataDesejada" />
        </p>
        <p>
          <label htmlFor="orcamentoMaximo">Quanto pretende gastar (opcional)</label>
          <input type="number" id="orcamentoMaximo" name="orcamentoMaximo" step="0.01" min="0" />
        </p>
        <p>
          <input type="submit" value="Publicar pedido" />
        </p>
      </form>
    </div>
  );
}
