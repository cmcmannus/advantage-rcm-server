import { Action } from "../../../shared/dist";
import { createCrudService } from "./create_crud_service";

export const actionService = createCrudService<Action>({
    createProc: "create_action",
    updateProc: "update_action",
    deleteProc: "delete_action",
    getAllProc: "get_actions",
});