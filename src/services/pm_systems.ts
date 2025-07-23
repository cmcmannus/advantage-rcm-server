import { PmSystem } from "../../../shared/dist";
import { createCrudService } from "./create_crud_service";

export const pmSystemService = createCrudService<PmSystem>({
    createProc: "create_pm_system",
    updateProc: "update_pm_system",
    deleteProc: "delete_pm_system",
    getAllProc: "get_pm_systems",
});
