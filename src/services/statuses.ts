import { InferSelectModel } from "drizzle-orm";
import { createCrudService } from "./create_crud_service.js";
import { statuses } from "../db/schema.js";

export const statusService = createCrudService<InferSelectModel<typeof statuses>>(statuses);
