import { InferSelectModel } from "drizzle-orm";
import { createCrudService } from "./create_crud_service.js";
import { actions } from "../db/schema.js";

export const actionService = createCrudService<InferSelectModel<typeof actions>>(actions);