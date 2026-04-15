
import { InferSelectModel } from "drizzle-orm";
import { createCrudService } from "./create_crud_service.js";
import { followUpReasons } from "../db/schema.js";

export const followUpReasonService = createCrudService<InferSelectModel<typeof followUpReasons>>(followUpReasons);