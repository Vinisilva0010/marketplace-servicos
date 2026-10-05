CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(50) NOT NULL,
	"descricao" text
);
--> statement-breakpoint
CREATE TABLE "cidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"estado" varchar(2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enderecos" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"cidade_id" integer NOT NULL,
	"logradouro" varchar(150) NOT NULL,
	"numero" varchar(20),
	"complemento" varchar(100),
	"bairro" varchar(100),
	"cep" varchar(9)
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"senha_hash" varchar(255) NOT NULL,
	"telefone" varchar(20),
	"tipo" varchar(20) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"data_cadastro" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_cidade_id_cidades_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."cidades"("id") ON DELETE no action ON UPDATE no action;