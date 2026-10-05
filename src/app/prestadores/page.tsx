import { buscarServicos, listarCategorias, listarCidades } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function PaginaPrestadores({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; cidade?: string; ordem?: string }>;
}) {
  const parametros = await searchParams;
  const categoriaId = parametros.categoria ? Number(parametros.categoria) : undefined;
  const cidadeId = parametros.cidade ? Number(parametros.cidade) : undefined;
  const ordem = parametros.ordem ?? "avaliacao";

  const [listaCategorias, listaCidades, resultados] = await Promise.all([
    listarCategorias(),
    listarCidades(),
    buscarServicos({ categoriaId, cidadeId, ordem }),
  ]);

  return (
    <div>
      <h2>Buscar profissionais</h2>

      <form method="get" action="/prestadores">
        <p>
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue={parametros.categoria ?? ""}>
            <option value="">Todas</option>
            {listaCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="cidade">Cidade</label>
          <select id="cidade" name="cidade" defaultValue={parametros.cidade ?? ""}>
            <option value="">Todas</option>
            {listaCidades.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>{cidade.nome} - {cidade.estado}</option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="ordem">Ordenar por</label>
          <select id="ordem" name="ordem" defaultValue={ordem}>
            <option value="avaliacao">Melhor avaliados</option>
            <option value="preco">Menor preço</option>
            <option value="experiencia">Mais experientes</option>
          </select>
        </p>
        <p>
          <input type="submit" value="Buscar" />
        </p>
      </form>

      <h3>{resultados.length} serviço(s) encontrado(s)</h3>

      {resultados.length === 0 ? (
        <p className="aviso">
          Nenhum profissional encontrado com esses filtros. Tente outra
          categoria ou outra cidade.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Profissional</th>
              <th>Avaliação</th>
              <th>Serviço</th>
              <th>Categoria</th>
              <th>Preço</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((item) => (
              <tr key={item.servicoId}>
                <td>
                  <a href={`/prestadores/${item.prestadorId}`}>{item.prestadorNome}</a>
                  {item.verificado ? " (verificado)" : ""}
                  <br />
                  {item.anosExperiencia} anos de experiência
                  <br />
                  {Number(item.servicosFeitos) > 0
                    ? `${item.servicosFeitos} serviço(s) concluído(s)`
                    : "Nenhum serviço concluído ainda"}
                </td>
                <td>
                  {Number(item.totalAvaliacoes) > 0
                    ? `${item.notaMedia} de 5 (${item.totalAvaliacoes})`
                    : "Sem avaliações"}
                </td>
                <td>
                  {item.titulo}
                  <br />
                  {item.descricao}
                </td>
                <td>{item.categoriaNome}</td>
                <td>R$ {item.precoBase} por {item.unidadePreco}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
