import { createCrudRoutes } from "./create_crud_routes";
import { clearingHouseService } from "../services/clearing_houses";

const router = createCrudRoutes(clearingHouseService, "clearing house");
export default router;