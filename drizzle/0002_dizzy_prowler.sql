CREATE TABLE "propostas" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitacao_id" integer NOT NULL,
	"prestador_id" integer NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"prazo_dias" integer,
	"mensagem" text,
	"status" varchar(20) DEFAULT 'enviada' NOT NULL,
	"data_envio" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitacoes_servico" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	"endereco_id" integer NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"descricao" text NOT NULL,
	"data_desejada" timestamp,
	"orcamento_maximo" numeric(10, 2),
	"status" varchar(20) DEFAULT 'aberta' NOT NULL,
	"data_criacao" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_solicitacao_id_solicitacoes_servico_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."solicitacoes_servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propostas" ADD CONSTRAINT "propostas_prestador_id_prestadores_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."prestadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_servico" ADD CONSTRAINT "solicitacoes_servico_cliente_id_usuarios_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_servico" ADD CONSTRAINT "solicitacoes_servico_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes_servico" ADD CONSTRAINT "solicitacoes_servico_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."enderecos"("id") ON DELETE no action ON UPDATE no action;