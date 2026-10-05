import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { listarCidades, listarCategorias } from "@/db/queries";
import {
  buscarUsuario, buscarPrestadorPorUsuario, buscarServicosDoPrestador,
  buscarCidadesDoPrestador, buscarAvaliacoesDoPrestador, mediaDoPrestador,
  atualizarDadosPessoais, atualizarDadosProfissionais,
  adicionarServico, atualizarServico, removerServico,
  adicionarCidadeAtuacao, removerCidadeAtuacao,
  buscarEnderecos, adicionarEndereco,
} from "@/db/perfil";

export default async function PerfilPrestador({ usuarioId }: { usuarioId: number }) {
  const usuario = await buscarUsuario(usuarioId);
  const prestador = await buscarPrestadorPorUsuario(usuarioId);

  if (!prestador) {
    return (
      <div>
        <h2>Meu perfil</h2>
        <p className="aviso">Seu perfil de prestador não foi encontrado.</p>
      </div>
    );
  }

  const [servicos, cidadesAtuacao, listaAvaliacoes, media, listaCidades, listaCategorias, listaEnderecos] =
    await Promise.all([
      buscarServicosDoPrestador(prestador.id),
      buscarCidadesDoPrestador(prestador.id),
      buscarAvaliacoesDoPrestador(prestador.id),
      mediaDoPrestador(prestador.id),
      listarCidades(),
      listarCategorias(),
      buscarEnderecos(usuarioId),
    ]);

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

  async function salvarProfissionais(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    await atualizarDadosProfissionais(meu.id, {
      apresentacao: String(formulario.get("apresentacao")).trim(),
      anosExperiencia: Number(formulario.get("anosExperiencia")),
    });
    redirect("/perfil");
  }

  async function salvarNovoServico(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    await adicionarServico({
      prestadorId: meu.id,
      categoriaId: Number(formulario.get("categoriaId")),
      titulo: String(formulario.get("titulo")).trim(),
      descricao: String(formulario.get("descricao")).trim(),
      precoBase: String(formulario.get("precoBase")),
      unidadePreco: String(formulario.get("unidadePreco")),
    });
    redirect("/perfil");
  }

  async function salvarServicoExistente(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    await atualizarServico(Number(formulario.get("servicoId")), meu.id, {
      titulo: String(formulario.get("titulo")).trim(),
      descricao: String(formulario.get("descricao")).trim(),
      precoBase: String(formulario.get("precoBase")),
      unidadePreco: String(formulario.get("unidadePreco")),
    });
    redirect("/perfil");
  }

  async function apagarServico(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    await removerServico(Number(formulario.get("servicoId")), meu.id);
    redirect("/perfil");
  }

  async function salvarCidadeAtuacao(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    await adicionarCidadeAtuacao(meu.id, Number(formulario.get("cidadeId")));
    redirect("/perfil");
  }

  async function apagarCidadeAtuacao(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    await removerCidadeAtuacao(Number(formulario.get("vinculoId")), meu.id);
    redirect("/perfil");
  }

  return (
    <div>
      <h2>Meu perfil profissional</h2>
      <p>
        <a href={`/prestadores/${prestador.id}`}>Ver meu perfil como os contratantes veem</a>
      </p>

      <p>
        <label>Minha avaliação</label>
        {media && Number(media.total) > 0
          ? `${media.media} de 5, com ${media.total} avaliação(ões)`
          : "Nenhuma avaliação ainda"}
      </p>
      <p><label>Situação do cadastro</label>{prestador.verificado ? "Verificado" : "Não verificado"}</p>

      <h3>Meus serviços</h3>
      <p>Estes são os serviços que aparecem na busca. O preço pode ser alterado a qualquer momento.</p>
      {servicos.length === 0 && (
        <p className="aviso">Você não tem nenhum serviço cadastrado, então não aparece na busca.</p>
      )}
      {servicos.map((servico) => (
        <div key={servico.id}>
          <form action={salvarServicoExistente}>
            <input type="hidden" name="servicoId" value={servico.id} />
            <p><label>Categoria</label>{servico.categoria}</p>
            <p>
              <label>Nome do serviço</label>
              <input type="text" name="titulo" defaultValue={servico.titulo} required />
            </p>
            <p>
              <label>Descrição</label>
              <textarea name="descricao" defaultValue={servico.descricao ?? ""}></textarea>
            </p>
            <p>
              <label>Preço</label>
              <input type="number" name="precoBase" step="0.01" min="0" defaultValue={servico.precoBase ?? ""} required />
            </p>
            <p>
              <label>Cobrado por</label>
              <select name="unidadePreco" defaultValue={servico.unidadePreco ?? "serviço"}>
                <option value="serviço">serviço</option>
                <option value="metro quadrado">metro quadrado</option>
                <option value="diária">diária</option>
                <option value="hora">hora</option>
              </select>
            </p>
            <p><input type="submit" value="Salvar alterações" /></p>
          </form>
          <p>
            <a href={`/confirmar?acao=removerServico&id=${servico.id}&volta=/perfil`}>
              Remover este serviço
            </a>
          </p>
          <hr />
        </div>
      ))}

      <form action={salvarNovoServico}>
        <h4>Adicionar serviço</h4>
        <p>
          <label htmlFor="categoriaNova">Categoria</label>
          <select id="categoriaNova" name="categoriaId" required>
            {listaCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="tituloNovo">Nome do serviço</label>
          <input type="text" id="tituloNovo" name="titulo" required />
        </p>
        <p>
          <label htmlFor="descricaoNova">Descrição</label>
          <textarea id="descricaoNova" name="descricao" required></textarea>
        </p>
        <p>
          <label htmlFor="precoNovo">Preço</label>
          <input type="number" id="precoNovo" name="precoBase" step="0.01" min="0" required />
        </p>
        <p>
          <label htmlFor="unidadeNova">Cobrado por</label>
          <select id="unidadeNova" name="unidadePreco" required>
            <option value="serviço">serviço</option>
            <option value="metro quadrado">metro quadrado</option>
            <option value="diária">diária</option>
            <option value="hora">hora</option>
          </select>
        </p>
        <p><input type="submit" value="Adicionar serviço" /></p>
      </form>

      <h3>Onde eu atendo</h3>
      <p>Você só recebe pedidos das cidades listadas aqui.</p>
      {cidadesAtuacao.length === 0 && (
        <p className="aviso">Nenhuma cidade cadastrada, então você não recebe pedidos.</p>
      )}
      <table>
        <thead>
          <tr>
            <th>Cidade</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {cidadesAtuacao.map((cidade) => (
            <tr key={cidade.vinculoId}>
              <td>{cidade.nome} - {cidade.estado}</td>
              <td>
                <form action={apagarCidadeAtuacao}>
                  <input type="hidden" name="vinculoId" value={cidade.vinculoId} />
                  <input type="submit" value="Remover" />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={salvarCidadeAtuacao}>
        <p>
          <label htmlFor="cidadeAtuacaoNova">Adicionar cidade</label>
          <select id="cidadeAtuacaoNova" name="cidadeId" required>
            {listaCidades.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>{cidade.nome} - {cidade.estado}</option>
            ))}
          </select>
        </p>
        <p><input type="submit" value="Adicionar cidade" /></p>
      </form>

      <h3>Minha apresentação</h3>
      <form action={salvarProfissionais}>
        <p>
          <label htmlFor="apresentacao">Texto que aparece no seu perfil</label>
          <textarea id="apresentacao" name="apresentacao" defaultValue={prestador.apresentacao ?? ""} required></textarea>
        </p>
        <p>
          <label htmlFor="anosExperiencia">Anos de experiência</label>
          <input type="number" id="anosExperiencia" name="anosExperiencia" min="0" defaultValue={prestador.anosExperiencia ?? 0} required />
        </p>
        <p><input type="submit" value="Salvar apresentação" /></p>
      </form>

      <h3>Avaliações que recebi</h3>
      {listaAvaliacoes.length === 0 ? (
        <p>Nenhuma avaliação recebida ainda.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Contratante</th>
              <th>Nota</th>
              <th>Comentário</th>
              <th>Minha resposta</th>
            </tr>
          </thead>
          <tbody>
            {listaAvaliacoes.map((avaliacao) => (
              <tr key={avaliacao.id}>
                <td>{avaliacao.servico}</td>
                <td>{avaliacao.autor}</td>
                <td>{avaliacao.nota} de 5</td>
                <td>{avaliacao.comentario}</td>
                <td>{avaliacao.respostaPrestador ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Meus dados pessoais</h3>
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
        <p>
          <label>Documento profissional</label>
          {prestador.tipoPessoa === "juridica"
            ? `CNPJ ${prestador.documento} - ${prestador.razaoSocial}`
            : `CPF ${prestador.documento}`}
        </p>
        <p><input type="submit" value="Salvar meus dados" /></p>
      </form>

      <h3>Meu endereço</h3>
      <p>Seu endereço não aparece para os contratantes. Ele serve para o seu cadastro.</p>
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
    </div>
  );
}
