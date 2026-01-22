import { createCrudRoutes } from "./create_crud_routes.js";
import { ehrSystemService } from "../services/ehr_systems.js";
import { ehrSystems } from "../db/schema.js";
import { InferSelectModel } from "drizzle-orm";

const router = createCrudRoutes<InferSelectModel<typeof ehrSystems>>(ehrSystemService, "ehr system");
export default router;