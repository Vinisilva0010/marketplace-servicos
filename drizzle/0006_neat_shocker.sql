CREATE TABLE "convites" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitacao_id" integer NOT NULL,
	"prestador_id" integer NOT NULL,
	"data_envio" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "convites" ADD CONSTRAINT "convites_solicitacao_id_solicitacoes_servico_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."solicitacoes_servico"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites" ADD CONSTRAINT "convites_prestador_id_prestadores_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."prestadores"("id") ON DELETE no action ON UPDATE no action;