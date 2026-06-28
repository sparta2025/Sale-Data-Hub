CREATE TABLE "access_tokens" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"user_agent" text,
	"ip_address" varchar(45),
	CONSTRAINT "access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"recovery_email" varchar(255),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"language" varchar(10) DEFAULT 'ru' NOT NULL,
	"theme" varchar(30) DEFAULT 'light' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36),
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" varchar(36),
	"detail" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36),
	"event" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"link" varchar(500),
	"is_read" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_tasks" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"prompt" text,
	"result" text,
	"error" text,
	"dataset_id" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"file_name" varchar(255),
	"row_count" integer DEFAULT 0 NOT NULL,
	"columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'ready' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_targets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"dataset_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"metric" varchar(100) NOT NULL,
	"target_value" numeric(18, 6) NOT NULL,
	"period" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_transactions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"dataset_id" varchar(36) NOT NULL,
	"country" varchar(100),
	"branch" varchar(100),
	"year" integer,
	"month" integer,
	"category" varchar(100),
	"sku" varchar(100),
	"revenue_net" numeric(18, 2),
	"gross_profit" numeric(18, 2),
	"ebitda" numeric(18, 2),
	"ebit" numeric(18, 2),
	"net_profit" numeric(18, 2),
	"cogs" numeric(18, 2),
	"marketing" numeric(18, 2),
	"overhead" numeric(18, 2),
	"units_sold" numeric(18, 4),
	"avg_price" numeric(18, 4),
	"gross_margin" numeric(10, 6),
	"ebitda_margin" numeric(10, 6),
	"roi" numeric(10, 6),
	"invested_capital" numeric(18, 2),
	"wacc" numeric(10, 6),
	"eva" numeric(18, 2),
	"bcg_quadrant" varchar(50),
	"market_share" numeric(10, 6),
	"growth_yoy" numeric(10, 6),
	"ocf" numeric(18, 2),
	"capex" numeric(18, 2),
	"dso" numeric(10, 2),
	"dpo" numeric(10, 2),
	"inventory" numeric(18, 2),
	"extra" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;