import { createCrudRoutes } from "./create_crud_routes.js";
import { clearingHouseService } from "../services/clearing_houses.js";
import { InferSelectModel } from "drizzle-orm";
import { clearingHouses } from "../db/schema.js";

const router = createCrudRoutes<InferSelectModel<typeof clearingHouses>>(clearingHouseService, "clearing house");
export default router;