CREATE TABLE "prestadores" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"apresentacao" text,
	"anos_experiencia" integer,
	"documento" varchar(20),
	"verificado" boolean DEFAULT false NOT NULL,
	CONSTRAINT "prestadores_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE TABLE "prestadores_cidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"prestador_id" integer NOT NULL,
	"cidade_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicos_oferecidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"prestador_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"descricao" text,
	"preco_base" numeric(10, 2),
	"unidade_preco" varchar(20)
);
--> statement-breakpoint
ALTER TABLE "prestadores" ADD CONSTRAINT "prestadores_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestadores_cidades" ADD CONSTRAINT "prestadores_cidades_prestador_id_prestadores_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."prestadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestadores_cidades" ADD CONSTRAINT "prestadores_cidades_cidade_id_cidades_id_fk" FOREIGN KEY ("cidade_id") REFERENCES "public"."cidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_oferecidos" ADD CONSTRAINT "servicos_oferecidos_prestador_id_prestadores_id_fk" FOREIGN KEY ("prestador_id") REFERENCES "public"."prestadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos_oferecidos" ADD CONSTRAINT "servicos_oferecidos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;