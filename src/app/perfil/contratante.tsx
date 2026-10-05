import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { listarCidades } from "@/db/queries";
import { buscarUsuario, buscarEnderecos, atualizarDadosPessoais, adicionarEndereco } from "@/db/perfil";
import { painelContratante } from "@/db/paineis";

export default async function PerfilContratante({ usuarioId }: { usuarioId: number }) {
  const usuario = await buscarUsuario(usuarioId);
  const listaEnderecos = await buscarEnderecos(usuarioId);
  const listaCidades = await listarCidades();
  const painel = await painelContratante(usuarioId);

  async function salvarPessoais(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    await atualizarDadosPessoais(atual.id, {
      nome: String(formulario.get("nome")).trim(),
      telefone: String(formulario.get("telefone")).trim(),
    });
    redirect("/perfil");
  }

  async function salvarEndereco(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    await adicionarEndereco({
      usuarioId: atual.id,
      cidadeId: Number(formulario.get("cidadeId")),
      logradouro: String(formulario.get("logradouro")).trim(),
      numero: String(formulario.get("numero")).trim(),
      complemento: String(formulario.get("complemento")).trim(),
      bairro: String(formulario.get("bairro")).trim(),
      cep: String(formulario.get("cep")).trim(),
    });
    redirect("/perfil");
  }

  return (
    <div>
      <h2>Meu perfil</h2>

      <h3>Meus dados</h3>
      <form action={salvarPessoais}>
        <p>
          <label htmlFor="nome">Nome completo</label>
          <input type="text" id="nome" name="nome" defaultValue={usuario?.nome ?? ""} required />
        </p>
        <p>
          <label htmlFor="telefone">Telefone</label>
          <input type="text" id="telefone" name="telefone" defaultValue={usuario?.telefone ?? ""} />
        </p>
        <p><label>Email</label>{usuario?.email}</p>
        <p><label>CPF</label>{usuario?.cpf}</p>
        <p><label>Data de nascimento</label>{usuario?.dataNascimento}</p>
        <p><input type="submit" value="Salvar meus dados" /></p>
      </form>

      <h3>Meus endereços</h3>
      <p>São estes os endereços que você pode escolher ao publicar um pedido.</p>
      <table>
        <thead>
          <tr>
            <th>Rua</th>
            <th>Número</th>
            <th>Complemento</th>
            <th>Bairro</th>
            <th>Cidade</th>
            <th>CEP</th>
          </tr>
        </thead>
        <tbody>
          {listaEnderecos.map((endereco) => (
            <tr key={endereco.id}>
              <td>{endereco.logradouro}</td>
              <td>{endereco.numero}</td>
              <td>{endereco.complemento}</td>
              <td>{endereco.bairro}</td>
              <td>{endereco.cidade} - {endereco.estado}</td>
              <td>{endereco.cep}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={salvarEndereco}>
        <h4>Adicionar endereço</h4>
        <p>
          <label htmlFor="cepNovo">CEP</label>
          <input type="text" id="cepNovo" name="cep" required />
        </p>
        <p>
          <label htmlFor="cidadeEndereco">Cidade</label>
          <select id="cidadeEndereco" name="cidadeId" required>
            {listaCidades.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>{cidade.nome} - {cidade.estado}</option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="bairroNovo">Bairro</label>
          <input type="text" id="bairroNovo" name="bairro" required />
        </p>
        <p>
          <label htmlFor="logradouroNovo">Rua</label>
          <input type="text" id="logradouroNovo" name="logradouro" required />
        </p>
        <p>
          <label htmlFor="numeroNovo">Número</label>
          <input type="text" id="numeroNovo" name="numero" required />
        </p>
        <p>
          <label htmlFor="complementoNovo">Complemento</label>
          <input type="text" id="complementoNovo" name="complemento" />
        </p>
        <p><input type="submit" value="Adicionar endereço" /></p>
      </form>

      <h3>Meu histórico</h3>
      <p><label>Pedidos publicados</label>{painel.total}</p>
      <p><label>Em andamento</label>{painel.emAndamento.length}</p>
      <p><label>Concluídos</label>{painel.concluidos.length + painel.aguardandoAvaliacao.length}</p>
      <p><a href="/solicitacoes?ver=meus">Ver todos os meus pedidos</a></p>
    </div>
  );
}
