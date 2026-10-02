DO $$ BEGIN
 CREATE TYPE "appointment_status" AS ENUM('CONFIRMED', 'CANCELLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "slots" (
  "id" text PRIMARY KEY NOT NULL,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone NOT NULL,
  "is_booked" boolean DEFAULT false NOT NULL,
  "version" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "appointments" (
  "id" text PRIMARY KEY NOT NULL,
  "slot_id" text NOT NULL,
  "client_name" text NOT NULL,
  "client_email" text NOT NULL,
  "status" "appointment_status" DEFAULT 'CONFIRMED' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "appointments_slot_id_unique" UNIQUE("slot_id")
);

DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slot_id_slots_id_fk"
   FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_slots_is_booked_start" ON "slots" ("is_booked","start_time");
CREATE INDEX IF NOT EXISTS "idx_appointments_status" ON "appointments" ("status");
