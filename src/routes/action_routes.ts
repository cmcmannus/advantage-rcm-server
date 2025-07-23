import { createCrudRoutes } from "./create_crud_routes";
import { actionService } from "../services/actions";

const router = createCrudRoutes(actionService, "action");
export default router;