import { createCrudRoutes } from "./create_crud_routes";
import { pmSystemService } from "../services/pm_systems";

const router = createCrudRoutes(pmSystemService, "pm system");
export default router;
// This file defines the routes for managing pm systems using a CRUD service.