import { EhrSystem } from "../../../shared/dist";
import { createCrudService } from "./create_crud_service";

export const ehrSystemService = createCrudService<EhrSystem>({
    createProc: "create_ehr_system",
    updateProc: "update_ehr_system",
    deleteProc: "delete_ehr_system",
    getAllProc: "get_ehr_systems",
});