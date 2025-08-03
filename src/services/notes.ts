import { pool } from '../utils/db';
import { Note } from '../../../shared/dist';

export async function createNote(payload: {
    practice_id?: number;
    provider_id?: number;
    user_id: number;
    timestamp: string;
    note: string;
}): Promise<void> {
    const { practice_id, provider_id, user_id, timestamp, note } = payload;
    await pool.query('CALL create_note(?, ?, ?, ?, ?)', [
        practice_id ?? null,
        provider_id ?? null,
        user_id,
        timestamp,
        note,
    ]);
}

export async function deleteNote(note_id: number): Promise<void> {
    await pool.query('CALL delete_note(?)', [note_id]);
}

export async function getNotes(filters: {
    practice_id?: number;
    provider_id?: number;
}): Promise<Note[]> {
    const { practice_id, provider_id } = filters;
    const [rows] = await pool.query('CALL get_notes(?, ?)', [
        practice_id ?? null,
        provider_id ?? null,
    ]) as [Note[], any];
    return rows as Note[];
}

export async function updateNote(note_id: number, note: string): Promise<void> {
    await pool.query('CALL update_note(?, ?)', [note_id, note]);
}