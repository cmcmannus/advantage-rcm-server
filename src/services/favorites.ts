import { and, eq } from "drizzle-orm";
import { initDb } from "../db/client";
import { userFavorites } from "../db/schema";

const db = initDb();

export async function addToUserFavorites(userId: number, practiceId?: number, providerId?: number): Promise<void> {
    await db.insert(userFavorites).values({
        userId,
        practiceId,
        providerId
    });
}

export async function removeFromUserFavorites(userId: number, practiceId?: number, providerId?: number): Promise<void> {
    await db.delete(userFavorites).where(
        and(
            eq(userFavorites.userId, userId),
            practiceId ? eq(userFavorites.practiceId, practiceId) : 
            providerId ? eq(userFavorites.providerId, providerId) :
            undefined
        )   
    );
}