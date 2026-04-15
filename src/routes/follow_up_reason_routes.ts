import { createCrudRoutes } from "./create_crud_routes.js";
import { followUpReasonService } from "../services/follow_up_reasons.js";
import { followUpReasons } from "../db/schema.js";
import { InferSelectModel } from "drizzle-orm";

const router = createCrudRoutes<InferSelectModel<typeof followUpReasons>>(followUpReasonService, "follow up reason");
export default router;
// This file defines the routes for managing follow-up reasons using a CRUD service.