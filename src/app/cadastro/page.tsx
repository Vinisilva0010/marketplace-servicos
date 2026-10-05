import { redirect } from "next/navigation";
import { listarCategorias, listarCidades } from "@/db/queries";
import { cadastrarCliente, cadastrarPrestador, emailJaUsado } from "@/db/cadastro";

export const dynamic = "force-dynamic";

export default async function PaginaCadastro({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; pessoa?: string; erro?: string }>;
}) {
  const parametros = await searchParams;
  const tipo = parametros.tipo === "prestador" ? "prestador" : "cliente";
  const tipoPessoa = parametros.pessoa === "juridica" ? "juridica" : "fisica";

  const [listaCategorias, listaCidades] = await Promise.all([
    listarCategorias(),
    listarCidades(),
  ]);

  async function salvar(formulario: FormData) {
    "use server";

    const tipoEscolhido = String(formulario.get("tipo"));
    const pessoaEscolhida = String(formulario.get("tipoPessoa") ?? "fisica");
    const email = String(formulario.get("email")).trim();

    if (await emailJaUsado(email)) {
      redirect(`/cadastro?tipo=${tipoEscolhido}&pessoa=${pessoaEscolhida}&erro=email`);
    }

    const pessoais = {
      nome: String(formulario.get("nome")).trim(),
      email: email,
      senha: String(formulario.get("senha")),
      telefone: String(formulario.get("telefone")).trim(),
      cpf: String(formulario.get("cpf")).trim(),
      dataNascimento: String(formulario.get("dataNascimento")),
    };

    const endereco = {
      cidadeId: Number(formulario.get("cidadeId")),
      logradouro: String(formulario.get("logradouro")).trim(),
      numero: String(formulario.get("numero")).trim(),
      complemento: String(formulario.get("complemento")).trim(),
      bairro: String(formulario.get("bairro")).trim(),
      cep: String(formulario.get("cep")).trim(),
    };

    if (tipoEscolhido === "prestador") {
      await cadastrarPrestador({
        pessoais,
        endereco,
        profissional: {
          tipoPessoa: pessoaEscolhida,
          razaoSocial: String(formulario.get("razaoSocial") ?? "").trim(),
          documento: String(formulario.get("documento") ?? "").trim(),
          apresentacao: String(formulario.get("apresentacao")).trim(),
          anosExperiencia: Number(formulario.get("anosExperiencia")),
          cidadeAtuacaoId: Number(formulario.get("cidadeAtuacaoId")),
        },
        servico: {
          categoriaId: Number(formulario.get("categoriaId")),
          titulo: String(formulario.get("tituloServico")).trim(),
          descricao: String(formulario.get("descricaoServico")).trim(),
          precoBase: String(formulario.get("precoBase")),
          unidadePreco: String(formulario.get("unidadePreco")).trim(),
        },
      });
    } else {
      await cadastrarCliente({ pessoais, endereco });
    }

    redirect("/entrar?cadastrado=1");
  }

  return (
    <div>
      <h2>Criar cadastro</h2>

      {parametros.erro === "email" && (
        <p className="aviso">Este email já está cadastrado. Use outro email.</p>
      )}

      <form method="get" action="/cadastro">
        <p>
          <label htmlFor="tipoEscolha">Quero me cadastrar como</label>
          <select id="tipoEscolha" name="tipo" defaultValue={tipo}>
            <option value="cliente">Cliente (quero contratar serviços)</option>
            <option value="prestador">Prestador (quero oferecer serviços)</option>
          </select>
        </p>
        {tipo === "prestador" && (
          <p>
            <label htmlFor="pessoaEscolha">Atuo como</label>
            <select id="pessoaEscolha" name="pessoa" defaultValue={tipoPessoa}>
              <option value="fisica">Pessoa física (CPF)</option>
              <option value="juridica">Pessoa jurídica (CNPJ)</option>
            </select>
          </p>
        )}
        <p>
          <input type="submit" value="Atualizar formulário" />
        </p>
      </form>

      <hr />

      <form action={salvar}>
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="tipoPessoa" value={tipoPessoa} />

        <h3>Dados pessoais</h3>
        <p>
          <label htmlFor="nome">Nome completo</label>
          <input type="text" id="nome" name="nome" required />
        </p>
        <p>
          <label htmlFor="cpf">CPF</label>
          <input type="text" id="cpf" name="cpf" placeholder="000.000.000-00" required />
        </p>
        <p>
          <label htmlFor="dataNascimento">Data de nascimento</label>
          <input type="date" id="dataNascimento" name="dataNascimento" required />
        </p>
        <p>
          <label htmlFor="telefone">Telefone</label>
          <input type="text" id="telefone" name="telefone" placeholder="(11) 90000-0000" required />
        </p>

        <h3>Dados de acesso</h3>
        <p>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />
        </p>
        <p>
          <label htmlFor="senha">Senha</label>
          <input type="password" id="senha" name="senha" required />
        </p>

        <h3>Endereço</h3>
        <p>
          <label htmlFor="cep">CEP</label>
          <input type="text" id="cep" name="cep" placeholder="00000-000" required />
        </p>
        <p>
          <label htmlFor="cidadeId">Cidade</label>
          <select id="cidadeId" name="cidadeId" required>
            {listaCidades.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>
                {cidade.nome} - {cidade.estado}
              </option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="bairro">Bairro</label>
          <input type="text" id="bairro" name="bairro" required />
        </p>
        <p>
          <label htmlFor="logradouro">Rua</label>
          <input type="text" id="logradouro" name="logradouro" required />
        </p>
        <p>
          <label htmlFor="numero">Número</label>
          <input type="text" id="numero" name="numero" required />
        </p>
        <p>
          <label htmlFor="complemento">Complemento</label>
          <input type="text" id="complemento" name="complemento" />
        </p>

        {tipo === "prestador" && (
          <>
            <h3>Dados profissionais</h3>
            {tipoPessoa === "juridica" && (
              <>
                <p>
                  <label htmlFor="razaoSocial">Razão social</label>
                  <input type="text" id="razaoSocial" name="razaoSocial" required />
                </p>
                <p>
                  <label htmlFor="documento">CNPJ</label>
                  <input type="text" id="documento" name="documento" placeholder="00.000.000/0001-00" required />
                </p>
              </>
            )}
            <p>
              <label htmlFor="apresentacao">Apresentação</label>
              <textarea
                id="apresentacao"
                name="apresentacao"
                placeholder="Conte o que você faz, como trabalha e o que está incluso no seu serviço."
                required
              ></textarea>
            </p>
            <p>
              <label htmlFor="anosExperiencia">Anos de experiência</label>
              <input type="number" id="anosExperiencia" name="anosExperiencia" min="0" required />
            </p>
            <p>
              <label htmlFor="cidadeAtuacaoId">Cidade onde você atende</label>
              <select id="cidadeAtuacaoId" name="cidadeAtuacaoId" required>
                {listaCidades.map((cidade) => (
                  <option key={cidade.id} value={cidade.id}>
                    {cidade.nome} - {cidade.estado}
                  </option>
                ))}
              </select>
            </p>

            <h3>Serviço que você oferece</h3>
            <p>
              <label htmlFor="categoriaId">Categoria</label>
              <select id="categoriaId" name="categoriaId" required>
                {listaCategorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </p>
            <p>
              <label htmlFor="tituloServico">Nome do serviço</label>
              <input type="text" id="tituloServico" name="tituloServico" required />
            </p>
            <p>
              <label htmlFor="descricaoServico">Descrição do serviço</label>
              <textarea id="descricaoServico" name="descricaoServico" required></textarea>
            </p>
            <p>
              <label htmlFor="precoBase">Preço</label>
              <input type="number" id="precoBase" name="precoBase" step="0.01" min="0" required />
            </p>
            <p>
              <label htmlFor="unidadePreco">Cobrado por</label>
              <select id="unidadePreco" name="unidadePreco" required>
                <option value="serviço">serviço</option>
                <option value="metro quadrado">metro quadrado</option>
                <option value="diária">diária</option>
                <option value="hora">hora</option>
              </select>
            </p>
          </>
        )}

        <p>
          <input type="submit" value="Criar cadastro" />
        </p>
      </form>
    </div>
  );
}
