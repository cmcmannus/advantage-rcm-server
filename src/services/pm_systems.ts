import { InferSelectModel } from "drizzle-orm";
import { createCrudService } from "./create_crud_service.js";
import { pmSystems } from "../db/schema.js";

export const pmSystemService = createCrudService<InferSelectModel<typeof pmSystems>>(pmSystems);
