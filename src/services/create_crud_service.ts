// services/create_crud_service.ts
import { initDb } from "../db/client.js";
import { eq, getTableColumns, sql } from 'drizzle-orm';
import { actions, clearingHouses, ehrSystems, followUpReasons, pmSystems, statuses } from '../db/schema.js';

const db = initDb();

type Tables = typeof actions | 
    typeof clearingHouses | 
    typeof ehrSystems | 
    typeof followUpReasons | 
    typeof pmSystems | 
    typeof statuses;

type AllowedTypes = {
    id: number;
    action: string;
} | {
    id: number;
    clearingHouseName: string;
} | {
    id: number;
    systemName: string;
} | {
    id: number;
    reason: string;
} | {
    id: number;
    pmSystem: string;
} | {
    id: number;
    status: string
};

export function createCrudService<T extends AllowedTypes>(
    table: Tables
): {
    create: (arg: string) => Promise<T>;
    update: (id: number, arg: string) => Promise<T>;
    delete: (id: number) => Promise<void>;
    getAll: () => Promise<T[]>;
} {
    const { id, ...columns } = getTableColumns(table);
    const columnName = Object.keys(columns)[0];

    return {
        async create(arg: string) {
            const result = await db.insert(table).values({
                [columnName]: arg
            });

            return {
                [columnName]: arg,
                id: result[0].insertId
            } as unknown as T;
        },

        async update(id: number, arg: string) {
            await db.update(table).set({
                [columnName]: arg
            }).where(eq(table.id, id));

            return {
                id,
                [columnName]: arg
            } as unknown as T;
        },

        async delete(id: number) {
            await db.delete(table).where(eq(table.id, id));
        },

        async getAll() {
            const result = await db.select().from(table);

            return result as T[];
        }
    };
}