
import { FollowUpReason } from "../../../shared/dist";
import { createCrudService } from "./create_crud_service";

export const followUpReasonService = createCrudService<FollowUpReason>({
    createProc: "create_follow_up_reason",
    updateProc: "update_follow_up_reason",
    deleteProc: "delete_follow_up_reason",
    getAllProc: "get_follow_up_reasons"
});