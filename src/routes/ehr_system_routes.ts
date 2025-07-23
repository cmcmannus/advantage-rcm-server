import { createCrudRoutes } from "./create_crud_routes";
import { ehrSystemService } from "../services/ehr_systems";

const router = createCrudRoutes(ehrSystemService, "ehr systen");
export default router;