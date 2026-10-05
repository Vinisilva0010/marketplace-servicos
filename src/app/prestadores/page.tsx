import { buscarServicos, listarCategorias, listarCidades } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function PaginaPrestadores({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; cidade?: string }>;
}) {
  const parametros = await searchParams;
  const categoriaId = parametros.categoria ? Number(parametros.categoria) : undefined;
  const cidadeId = parametros.cidade ? Number(parametros.cidade) : undefined;

  const [listaCategorias, listaCidades, resultados] = await Promise.all([
    listarCategorias(),
    listarCidades(),
    buscarServicos({ categoriaId, cidadeId }),
  ]);

  return (
    <div>
      <h2>Buscar prestadores</h2>

      <form method="get" action="/prestadores">
        <p>
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue={parametros.categoria ?? ""}>
            <option value="">Todas</option>
            {listaCategorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="cidade">Cidade</label>
          <select id="cidade" name="cidade" defaultValue={parametros.cidade ?? ""}>
            <option value="">Todas</option>
            {listaCidades.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>
                {cidade.nome} - {cidade.estado}
              </option>
            ))}
          </select>
        </p>
        <p>
          <input type="submit" value="Buscar" />
        </p>
      </form>

      <h3>{resultados.length} serviço(s) encontrado(s)</h3>

      {resultados.length === 0 ? (
        <p className="aviso">Nenhum serviço encontrado com esses filtros.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Categoria</th>
              <th>Prestador</th>
              <th>Experiência</th>
              <th>Preço</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((item) => (
              <tr key={item.servicoId}>
                <td>{item.titulo}</td>
                <td>{item.categoriaNome}</td>
                <td>
                  <a href={`/prestadores/${item.prestadorId}`}>{item.prestadorNome}</a>
                  {item.verificado ? " (verificado)" : ""}
                </td>
                <td>{item.anosExperiencia} anos</td>
                <td>
                  R$ {item.precoBase} por {item.unidadePreco}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
