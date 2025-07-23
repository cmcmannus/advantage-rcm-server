import { createCrudRoutes } from "./create_crud_routes";
import { followUpReasonService } from "../services/follow_up_reasons";

const router = createCrudRoutes(followUpReasonService, "follow up reason");
export default router;
// This file defines the routes for managing follow-up reasons using a CRUD service.