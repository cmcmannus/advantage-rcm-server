
import { pool } from "../utils/db";
import { AccessLevel, mapUser, User, UserSearchParams, UserSummary } from "../../../shared/dist";
import { ResultSetHeader } from "mysql2";

export async function createUser(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    sales_rep: boolean;
    access_level: number;
}) {
    const [rows] = await pool.query(
        "CALL create_user(?, ?, ?, ?, ?, ?)",
        [
            data.email,
            data.password,
            data.first_name,
            data.last_name,
            data.sales_rep,
            data.access_level,
        ]
    ) as [User[], any];
    return rows[0]; // Assuming the stored procedure returns the updated user object
}

export async function updateUser(data: {
    id: number;
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    sales_rep?: boolean;
    access_level?: number;
}) {
    const [rows] = await pool.query(
        "CALL update_user(?, ?, ?, ?, ?, ?, ?)",
        [
            data.id,
            data.email ?? null,
            data.password ?? null,
            data.first_name ?? null,
            data.last_name ?? null,
            data.sales_rep ?? null,
            data.access_level ?? null,
        ]
    ) as [User[], any];
    return rows[0]; // Assuming the stored procedure returns the updated user object
}

export async function deactivateUser(id: number): Promise<boolean> {
    const [rows] = await pool.execute("CALL deactivate_user(?)", [id]) as [ResultSetHeader, any];
    if (rows.affectedRows > 0) {
        return true;
    }
    return false;
}

export async function getUserById(id: number): Promise<User | null> {
    if (!id) return null;
    const [rows] = await pool.query("CALL get_user_by_id(?)", [id]) as [User[], any];
    if (rows.length === 0) return null;
    // Assuming the stored procedure returns a single user object
    return rows[0];
}

export async function loginUser(data: {
    email: string;
    password: string;
}): Promise<User | null> {
    const [rows] = await pool.query(
        "CALL login_user(?, ?)",
        [
            data.email,
            data.password
        ]
    ) as [User[], any];
    if (rows.length === 0) return null; // No user found
    return rows[0]; // Logged in user is returned
}

export async function getUsers(params: UserSearchParams) {
    const {
        email = null,
        first_name = null,
        last_name = null,
        sales_rep = null,
        access_level = null,
        active = null,
        sort_column = 'id',
        sort_direction = 'ASC',
    } = params;

    const [rows] = await pool.query(
        "CALL get_users(?, ?, ?, ?, ?, ?, ?, ?)",
        [
            email,
            first_name,
            last_name,
            sales_rep,
            access_level,
            active,
            sort_column,
            sort_direction,
        ]
    ) as [UserSummary[], any];
    if (rows.length === 0) return []; // No users found

    const users: UserSummary[] = rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        sales_rep: !!row.sales_rep,
        access_level: row.access_level as AccessLevel,
        active: !!row.active,
    }));

    return users; // First result set contains the data
}