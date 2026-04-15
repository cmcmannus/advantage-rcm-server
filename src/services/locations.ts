import { locations } from "../db/schema.js";
import { initDb } from "../db/client.js";
import { eq, InferInsertModel, InferSelectModel, like, asc, desc } from "drizzle-orm";

const db = initDb();

export type InsertModel = InferInsertModel<typeof locations>;
export type SelectModel = InferSelectModel<typeof locations>;

export async function createLocation(payload: InsertModel): Promise<SelectModel> {
    const result = await db.insert(locations).values(payload);
    return (await db.select().from(locations).where(eq(locations.id, result[0].insertId)))[0];
}

export async function updateLocation(payload: SelectModel): Promise<SelectModel> {
    const { id, ...updateModel } = payload;
    await db.update(locations).set(updateModel).where(eq(locations.id, id));
    return (await db.select().from(locations).where(eq(locations.id, id)))[0];
}

export async function deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
}

export async function getLocations(filters: {
    address?: string;
    city?: string;
    state?: string;
    page?: number;
    sort?: keyof typeof locations.$inferSelect;
    order?: 'asc' | 'desc';
}): Promise<SelectModel[]> {
    const { address, city, state, page = 1, sort = 'address1', order = 'asc' } = filters;

    let query = db.select().from(locations).$dynamic();

    if (address)
        query.where(like(locations.address1, `${address}%`));
    if (city)
        query.where(eq(locations.city, city));
    if (state)
        query.where(eq(locations.state, state));

    return query.orderBy(order === 'asc' ? asc(locations[sort]) : desc(locations[sort])) .offset((page - 1) * 25).limit(25);
}