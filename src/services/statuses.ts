import { Status } from "../../../shared/dist";
import { createCrudService } from "./create_crud_service";
export const statusService = createCrudService<Status>({
    createProc: "create_status",
    updateProc: "update_status",
    deleteProc: "delete_status",
    getAllProc: "get_statuses",
});
