// services/create_crud_service.ts
import { pool, extractSingleResult, extractList } from "../utils/db";

interface CrudProcedureConfig {
    createProc: string;
    updateProc: string;
    deleteProc: string;
    getAllProc: string;
}

export function createCrudService<T>(
    config: CrudProcedureConfig
): {
    create: (arg: any) => Promise<T>;
    update: (id: number, arg: any) => Promise<T>;
    delete: (id: number) => Promise<void>;
    getAll: () => Promise<T[]>;
} {
    return {
        async create(arg) {
            const [rows] = await pool.query(`CALL ${config.createProc}(?)`, [arg]) as [T[], any];
            return extractSingleResult<T>(rows);
        },

        async update(id, arg) {
            const [rows] = await pool.query(`CALL ${config.updateProc}(?, ?)`, [id, arg]) as [T[], any];
            return extractSingleResult<T>(rows);
        },

        async delete(id) {
            await pool.query(`CALL ${config.deleteProc}(?)`, [id]) as [unknown, any];
        },

        async getAll() {
            const [rows] = await pool.query(`CALL ${config.getAllProc}()`) as [T[], any];
            return extractList<T>(rows);
        },
    };
}