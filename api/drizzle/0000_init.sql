CREATE TYPE "public"."material_status" AS ENUM('Active', 'Obsolete', 'Pending Review');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('Spare Part', 'Consumable', 'Raw Material', 'Tool');--> statement-breakpoint
CREATE TYPE "public"."unit_of_measure" AS ENUM('EA', 'KG', 'L', 'M', 'BOX', 'SET');--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "manufacturers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "manufacturers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "materials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"material_number" text NOT NULL,
	"description" text NOT NULL,
	"material_type" "material_type" NOT NULL,
	"status" "material_status" NOT NULL,
	"plant_id" integer NOT NULL,
	"manufacturer_id" integer,
	"manufacturer_part_number" text,
	"unit_of_measure" "unit_of_measure" NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_material_number_unique" UNIQUE("material_number"),
	CONSTRAINT "materials_unit_price_check" CHECK ("materials"."unit_price" >= 0),
	CONSTRAINT "materials_quantity_on_hand_check" CHECK ("materials"."quantity_on_hand" >= 0)
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "plants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materials_plant_id_idx" ON "materials" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "materials_manufacturer_id_idx" ON "materials" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "materials_status_idx" ON "materials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "materials_material_type_idx" ON "materials" USING btree ("material_type");--> statement-breakpoint
CREATE INDEX "materials_updated_at_id_idx" ON "materials" USING btree ("updated_at","id");