import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { usuarios, enderecos, prestadores, servicosOferecidos, prestadoresCidades } from "./schema";

export async function cpfJaUsado(cpf: string) {
  const achados = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.cpf, cpf));
  return achados.length > 0;
}

export async function emailJaUsado(email: string) {
  const achados = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email));
  return achados.length > 0;
}

type DadosPessoais = {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
};

type DadosEndereco = {
  cidadeId: number;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
};

async function criarUsuarioComEndereco(
  pessoais: DadosPessoais,
  endereco: DadosEndereco,
  tipo: string
) {
  const senhaHash = await bcrypt.hash(pessoais.senha, 10);

  const [usuario] = await db
    .insert(usuarios)
    .values({
      nome: pessoais.nome,
      email: pessoais.email,
      senhaHash: senhaHash,
      telefone: pessoais.telefone,
      cpf: pessoais.cpf,
      dataNascimento: pessoais.dataNascimento,
      tipo: tipo,
    })
    .returning();

  await db.insert(enderecos).values({
    usuarioId: usuario.id,
    cidadeId: endereco.cidadeId,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cep: endereco.cep,
  });

  return usuario;
}

export async function cadastrarCliente(dados: {
  pessoais: DadosPessoais;
  endereco: DadosEndereco;
}) {
  return criarUsuarioComEndereco(dados.pessoais, dados.endereco, "cliente");
}

export async function cadastrarPrestador(dados: {
  pessoais: DadosPessoais;
  endereco: DadosEndereco;
  profissional: {
    tipoPessoa: string;
    razaoSocial: string;
    documento: string;
    apresentacao: string;
    anosExperiencia: number;
    cidadeAtuacaoId: number;
  };
  servico: {
    categoriaId: number;
    titulo: string;
    descricao: string;
    precoBase: string;
    unidadePreco: string;
  };
}) {
  const usuario = await criarUsuarioComEndereco(dados.pessoais, dados.endereco, "prestador");

  const [prestador] = await db
    .insert(prestadores)
    .values({
      usuarioId: usuario.id,
      tipoPessoa: dados.profissional.tipoPessoa,
      razaoSocial: dados.profissional.razaoSocial || null,
      documento: dados.profissional.documento,
      apresentacao: dados.profissional.apresentacao,
      anosExperiencia: dados.profissional.anosExperiencia,
      verificado: false,
    })
    .returning();

  await db.insert(servicosOferecidos).values({
    prestadorId: prestador.id,
    categoriaId: dados.servico.categoriaId,
    titulo: dados.servico.titulo,
    descricao: dados.servico.descricao,
    precoBase: dados.servico.precoBase,
    unidadePreco: dados.servico.unidadePreco,
  });

  await db.insert(prestadoresCidades).values({
    prestadorId: prestador.id,
    cidadeId: dados.profissional.cidadeAtuacaoId,
  });

  return usuario;
}
