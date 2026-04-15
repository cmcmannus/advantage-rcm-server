import { InferSelectModel } from "drizzle-orm";
import { createCrudService } from "./create_crud_service.js";
import { ehrSystems } from "../db/schema.js";

export const ehrSystemService = createCrudService<InferSelectModel<typeof ehrSystems>>(ehrSystems);