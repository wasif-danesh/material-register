CREATE INDEX "materials_material_number_trgm_idx" ON "materials" USING gin ("material_number" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "materials_description_trgm_idx" ON "materials" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "materials_manufacturer_part_number_trgm_idx" ON "materials" USING gin ("manufacturer_part_number" gin_trgm_ops);