import { createCrudRoutes } from "./create_crud_routes.js";
import { pmSystemService } from "../services/pm_systems.js";
import { pmSystems } from "../db/schema.js";
import { InferSelectModel } from "drizzle-orm";

const router = createCrudRoutes<InferSelectModel<typeof pmSystems>>(pmSystemService, "pm system");
export default router;
// This file defines the routes for managing pm systems using a CRUD service.