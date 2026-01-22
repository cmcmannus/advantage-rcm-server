import { InferSelectModel } from "drizzle-orm";
import { createCrudService } from "./create_crud_service.js";
import { clearingHouses } from "../db/schema.js";

export const clearingHouseService = createCrudService<InferSelectModel<typeof clearingHouses>>(clearingHouses);