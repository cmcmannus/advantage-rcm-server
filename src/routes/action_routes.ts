import { createCrudRoutes } from "./create_crud_routes.js";
import { actionService } from "../services/actions.js";
import { actions } from "../db/schema.js";
import { InferSelectModel } from "drizzle-orm";

const router = createCrudRoutes<InferSelectModel<typeof actions>>(actionService, "action");
export default router;