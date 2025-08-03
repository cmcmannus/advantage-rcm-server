import { pool } from '../utils/db';
import { SearchResult } from '../../../shared/dist';

export async function searchPracticeProvider(params: {
    search_text?: string;
    status_id?: number;
    action_id?: number;
    follow_up_reason_id?: number;
    sales_rep_id?: number;
    limit?: number;
    offset?: number;
}): Promise<SearchResult[]> {
    const {
        search_text,
        status_id,
        action_id,
        follow_up_reason_id,
        sales_rep_id,
        limit = 50,
        offset = 0,
    } = params;

    const [rows] = await pool.query('CALL search_practice_provider(?, ?, ?, ?, ?, ?, ?)', [
        search_text ?? null,
        status_id ?? null,
        action_id ?? null,
        follow_up_reason_id ?? null,
        sales_rep_id ?? null,
        limit,
        offset,
    ]) as [SearchResult[], any];

    return rows;
}