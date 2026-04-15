import { initDb } from "../db/client.js";
import { users } from "../db/schema.js";
import * as bcrypt from 'bcryptjs';
import { eq, asc, desc, and, InferSelectModel, InferInsertModel, like, gt } from "drizzle-orm";
import { formatDate } from "../utils/db.js";
import { Emailer } from "./email.js";

const db = initDb();

export type SelectModel = InferSelectModel<typeof users>;
export type InsertModel = Omit<InferInsertModel<typeof users>, 'password' | 'resetToken' | 'resetTokenExpiration'>;

export type SearchParams = {
    email?: string;
    firstName?: string;
    lastName?: string;
    salesRep?: number;
    accessLevel?: number;
    active?: number;
    sortColumn?: keyof typeof users.$inferSelect;
    sortDirection?: 'ASC' | 'DESC';
}

export type UserResponseModel = Omit<SelectModel, 'password' | 'resetToken' | 'resetTokenExpiration'>;
type TransformModel = Partial<SelectModel>;

const mapDbUserToResponse = (model: SelectModel): UserResponseModel => {
    const { password, resetToken, resetTokenExpiration, ...user } = model;
    return user;
}

const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function createUser(payload: InsertModel): Promise<UserResponseModel | null> {
    const hashed_pass = await bcrypt.hash(generateRandomPassword(), 10);

    await db.insert(users).values({
        ...payload,
        password: hashed_pass,
    });

    const user = await db.select().from(users).where(eq(users.email, payload.email));

    const mailer = new Emailer();
    await mailer.sendWelcomeEmail(payload.email);

    if (user && user[0]) {
        return mapDbUserToResponse(user[0]);
    }
    return null;
}

export async function updateUser(payload: SelectModel): Promise<UserResponseModel> {
    let user = (await db.select().from(users).where(eq(users.id, payload.id)))?.[0];

    if (!user) {
        throw new Error('User not found');
    }

    const update_data: {
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        salesRep?: number;
        accessLevel?: number;
        updated?: Date;
    } = {};

    if (payload.email) (update_data as any).email = payload.email;
    if (payload.firstName) (update_data as any).firstName = payload.firstName;
    if (payload.lastName) (update_data as any).lastName = payload.lastName;
    if (payload.salesRep !== undefined) (update_data as any).salesRep = payload.salesRep ? 1 : 0;
    if (payload.accessLevel !== undefined) (update_data as any).accessLevel = payload.accessLevel;
    update_data.updated = new Date();

    await db.update(users).set(update_data).where(eq(users.id, payload.id));

    user = (await db.select().from(users).where(eq(users.id, payload.id)))?.[0];
    
    return mapDbUserToResponse(user);
}

export async function deleteUser(id: number): Promise<boolean> {
    if (!id) return false;

    const result = await db.delete(users).where(eq(users.id, id));

    if (result[0].affectedRows && result[0].affectedRows > 0) return true;

    return false;
}

export async function deactivateUser(id: number): Promise<boolean> {
    if (!id) return false;

    const result = await db.update(users).set({ active: 0, updated: new Date() }).where(eq(users.id, id));

    if (result[0].affectedRows && result[0].affectedRows > 0) return true;

    return false;
}

export async function getUserById(id: number): Promise<UserResponseModel | null> {
    if (!id) return null;

    const user = (await db.select().from(users).where(eq(users.id, id)))?.[0];
    if (!user) return null;

    return mapDbUserToResponse(user);
}

export async function loginUser(data: {
    email: string;
    password: string;
}): Promise<UserResponseModel | null> {
    const user = (await db.select().from(users)
        .where(
            and(
                eq(users.email, data.email),
                eq(users.active, 1)
            )
        )
    )?.[0];

    if (!user) return null;

    if (!bcrypt.compareSync(data.password, user.password)) return null; // No user found

    let retUser: TransformModel = {...user};

    delete retUser.password;
    delete retUser.resetToken;
    delete retUser.resetTokenExpiration;

    return retUser as UserResponseModel; // Logged in user is returned
}

export async function getUsers(params: SearchParams) {
    const {
        email = null,
        firstName = null,
        lastName = null,
        salesRep = null,
        accessLevel = null,
        active = null,
        sortColumn = 'email',
        sortDirection = 'ASC',
    } = params;

    const dbUsers = db.select().from(users);
    const filters = [];
    if (email) filters.push(like(users.email, `%${email}%`));
    if (firstName) filters.push(like(users.firstName, `%${firstName}%`));
    if (lastName) filters.push(like(users.lastName, `%${lastName}%`));
    if (salesRep !== null) filters.push(eq(users.salesRep, salesRep ? 1 : 0));
    if (accessLevel !== null) filters.push(eq(users.accessLevel, accessLevel));
    if (active !== null) filters.push(eq(users.active, active ? 1 : 0));
    if (filters.length > 0) {
        dbUsers.where(and(...filters));
    }
    dbUsers.orderBy(sortDirection === 'ASC' ? asc(users[sortColumn]) : desc(users[sortColumn]));

    const userSummaries = (await dbUsers).map(user => {
        const { password, resetToken, resetTokenExpiration, created, updated, ...rest } = user;
        return {
            ...rest,
            created: formatDate(created),
            updated: formatDate(updated),
        };
    });

    return userSummaries; // First result set contains the data
}

export async function setResetToken(id: number, token: string, expiry: Date): Promise<boolean> {
    if (!id || !token || !expiry) return false;

    const result = await db.update(users).set({ resetToken: token, resetTokenExpiration: expiry, updated: new Date() }).where(eq(users.id, id));

    if (result[0].affectedRows && result[0].affectedRows > 0) return true;

    return false;
}

export async function validateResetToken(token: string): Promise<boolean> {
    if (!token) return false;

    const isValid = (await db.select({
        id: users.id
    }).from(users).where(
        and(
            eq(users.resetToken, token),
            gt(users.resetTokenExpiration, new Date())
        )
    )).length === 1;

    return isValid;
}

export async function resetPassword(payload: {
    token: string;
    newPassword: string;
}) {
    try {
        const { token, newPassword } = payload;

        if (!token || !newPassword) return false;

        const hashed_pass = await bcrypt.hash(newPassword, 10);

        const user = (await db.select().from(users).where(eq(users.resetToken, token)))?.[0];

        if (!user) return null;

        const result = await db.update(users).set({
            password: hashed_pass,
            resetToken: null,
            resetTokenExpiration: null
        }).where(eq(users.resetToken, token));

        if (result[0].affectedRows === 1) return user.email;

        return null;
    } catch (ex: any) {
        throw new Error(ex.message)
    }
}

export async function verifyResetToken(token: string): Promise<boolean> {
    if (!token) return false;

    const user = (await db.select().from(users).where(
        and(
            eq(users.resetToken, token),
            gt(users.resetTokenExpiration, new Date()),
            eq(users.active, 1)
        )
    ))?.[0];

    if (!user) return false;

    return true;
}