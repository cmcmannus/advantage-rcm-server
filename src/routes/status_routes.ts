import { createCrudRoutes } from "./create_crud_routes";
import { statusService } from "../services/statuses";

const router = createCrudRoutes(statusService, "status");
export default router;
// This file defines the routes for managing statuses using a CRUD service.