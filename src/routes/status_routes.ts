import { createCrudRoutes } from "./create_crud_routes.js";
import { statusService } from "../services/statuses.js";
import { statuses } from "../db/schema.js";
import { InferSelectModel } from "drizzle-orm";

const router = createCrudRoutes<InferSelectModel<typeof statuses>>(statusService, "status");
export default router;
// This file defines the routes for managing statuses using a CRUD service.