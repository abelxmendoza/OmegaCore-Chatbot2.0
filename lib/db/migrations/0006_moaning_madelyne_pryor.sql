-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"metadata" json,
	"importance" varchar DEFAULT 'medium' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create indexes for optimal query performance
-- Vector similarity search index (IVFFlat for fast approximate search)
CREATE INDEX IF NOT EXISTS "Memory_embedding_idx" ON "Memory" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- User ID index for fast filtering
CREATE INDEX IF NOT EXISTS "Memory_userId_idx" ON "Memory" ("userId");

-- Composite index for user + importance queries
CREATE INDEX IF NOT EXISTS "Memory_userId_importance_idx" ON "Memory" ("userId", "importance");

-- Timestamp index for chronological queries
CREATE INDEX IF NOT EXISTS "Memory_createdAt_idx" ON "Memory" ("createdAt" DESC);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
