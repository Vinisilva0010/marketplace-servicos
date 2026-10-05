CREATE TABLE "avaliacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitacao_id" integer NOT NULL,
	"autor_id" integer NOT NULL,
	"prestador_id" integer NOT NULL,
	"nota" integer NOT NULL,
	"comentario" text,
	"resposta_prestador" text,
	"data_avaliacao" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "avaliacoes_solicitacao_id_unique" UNIQUE("solicitacao_id")
);
--> statement-breakpoint
CREATE TABLE "mensagens" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitacao_id" integer NOT NULL,
	"remetente_id" integer NOT NULL,
	"conteudo" text NOT NULL,
	"lida" boolean DEFAULT false NOT NULL,
	"data_envio" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposta_id" integer NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"forma_pagamento" varchar(30),
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"data_retencao" timestamp,
	"data_liberacao" timestamp,
	CONSTRAINT "pagamentos_proposta_id_unique" UNIQUE("proposta_id")
);
--> statement-breakpoint
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_solicitacao_id_solicitacoes_servico_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."solicitacoes_servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_prestador_id_prestadores_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."prestadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_solicitacao_id_solicitacoes_servico_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."solicitacoes_servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetente_id_usuarios_id_fk" FOREIGN KEY ("remetente_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_proposta_id_propostas_id_fk" FOREIGN KEY ("proposta_id") REFERENCES "public"."propostas"("id") ON DELETE no action ON UPDATE no action;