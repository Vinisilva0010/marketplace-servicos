ALTER TABLE "prestadores" ADD COLUMN "tipo_pessoa" varchar(10) DEFAULT 'fisica' NOT NULL;--> statement-breakpoint
ALTER TABLE "prestadores" ADD COLUMN "razao_social" varchar(150);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "cpf" varchar(14);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "data_nascimento" date;