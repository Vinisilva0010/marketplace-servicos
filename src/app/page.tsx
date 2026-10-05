import { contarPorCategoria } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const listaCategorias = await contarPorCategoria();

  return (
    <div>
      <h2>Categorias de serviço</h2>
      <p>
        Clique em uma categoria para ver quem atende nela.
      </p>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Descrição</th>
            <th>Serviços cadastrados</th>
          </tr>
        </thead>
        <tbody>
          {listaCategorias.map((categoria) => (
            <tr key={categoria.id}>
              <td>
                <a href={`/prestadores?categoria=${categoria.id}`}>
                  {categoria.nome}
                </a>
              </td>
              <td>{categoria.descricao}</td>
              <td>{categoria.totalServicos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
