import { initDb } from "../db/client.js";
import { users } from "../db/schema.js";
import * as bcrypt from 'bcryptjs';
import { eq, asc, desc, and, InferSelectModel, InferInsertModel, like, gt } from "drizzle-orm";
import { formatDate } from "../utils/db.js";
import { Emailer } from "./email.js";
import * as crypto from 'crypto';

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

const mapDbUserToResponse = (model: Partial<SelectModel>): UserResponseModel => {
    const { password, resetToken, resetTokenExpiration, ...user } = model as SelectModel;
    return user;
}

const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    const charsLength = chars.length;
    const randomValues = new Uint32Array(12);
    crypto.getRandomValues(randomValues);
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars[randomValues[i] % charsLength];
    }
    return password;
}

export async function createUser(payload: InsertModel): Promise<UserResponseModel | null> {
    const hashed_pass = await bcrypt.hash(generateRandomPassword(), 10);

    const result = await db.insert(users).values({
        ...payload,
        password: hashed_pass,
    });

    const mailer = new Emailer();
    await mailer.sendWelcomeEmail(payload.email);

    const user = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        salesRep: users.salesRep,
        accessLevel: users.accessLevel,
        active: users.active,
        created: users.created,
        updated: users.updated
    }).from(users).where(eq(users.id, result[0].insertId));

    if (user && user[0]) {
        return mapDbUserToResponse(user[0]);
    }
    return null;
}

export async function updateUser(payload: SelectModel): Promise<UserResponseModel> {
    const existingUser = (await db.select().from(users).where(eq(users.id, payload.id)))?.[0];

    if (!existingUser) {
        throw new Error('User not found');
    }

    type UpdateData = Partial<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        salesRep: number;
        accessLevel: number;
        updated: Date;
    }>;

    const update_data: UpdateData = {};

    if (payload.email) update_data.email = payload.email;
    if (payload.firstName) update_data.firstName = payload.firstName;
    if (payload.lastName) update_data.lastName = payload.lastName;
    if (payload.salesRep !== undefined) update_data.salesRep = payload.salesRep ? 1 : 0;
    if (payload.accessLevel !== undefined) update_data.accessLevel = payload.accessLevel;
    update_data.updated = new Date();

    await db.update(users).set(update_data).where(eq(users.id, payload.id));

    return mapDbUserToResponse({
        ...existingUser,
        ...update_data
    } as SelectModel);
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

    const user = (await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        salesRep: users.salesRep,
        accessLevel: users.accessLevel,
        active: users.active,
        created: users.created,
        updated: users.updated
    }).from(users).where(eq(users.id, id)))?.[0];
    if (!user) return null;

    return mapDbUserToResponse(user);
}

export async function loginUser(data: {
    email: string;
    password: string;
}): Promise<UserResponseModel | null> {
    const user = (await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        salesRep: users.salesRep,
        accessLevel: users.accessLevel,
        active: users.active,
        created: users.created,
        updated: users.updated,
        password: users.password
    }).from(users)
        .where(
            and(
                eq(users.email, data.email),
                eq(users.active, 1)
            )
        )
    )?.[0];

    if (!user) return null;

    if (!bcrypt.compareSync(data.password, user.password)) return null;

    return mapDbUserToResponse(user);
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