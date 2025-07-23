import { ClearingHouse } from "../../../shared/dist";
import { createCrudService } from "./create_crud_service";

export const clearingHouseService = createCrudService<ClearingHouse>({
    createProc: "create_clearing_house",
    updateProc: "update_clearing_house",
    deleteProc: "delete_clearing_house",
    getAllProc: "get_clearing_houses",
});