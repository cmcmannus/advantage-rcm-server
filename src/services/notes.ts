import { notes } from "../db/schema.js";
import { initDb } from "../db/client.js";
import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";

const db = initDb();

export type InsertModel = InferInsertModel<typeof notes>;
export type SelectModel = InferSelectModel<typeof notes>;

export async function createNote(payload: InsertModel): Promise<SelectModel> {
    const result = await db.insert(notes).values(payload);
    return (await db.select().from(notes).where(eq(notes.id, result[0].insertId)))[0];
}

export async function updateNote(noteId: number, note: string): Promise<SelectModel> {
    await db.update(notes).set({ note }).where(eq(notes.id, noteId));
    return (await db.select().from(notes).where(eq(notes.id, noteId)))[0];
}

export async function deleteNote(note_id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, note_id));
}

export async function getNotes(filters: {
    practiceId?: number;
    providerId?: number;
}): Promise<SelectModel[]> {
    const { practiceId, providerId } = filters;

    if (!practiceId && !providerId) return [];

    let where;
    if (practiceId)
        where = eq(notes.practiceId, practiceId);
    else if (providerId)
        where = eq(notes.providerId, providerId);

    return db.select().from(notes).where(where);
}