import { pool } from '../utils/db';
import { Provider } from '../../../shared/dist';

export async function createProvider(payload: Omit<Provider, 'id'>): Promise<void> {
    const {
        npi,
        first_name,
        middle_name,
        last_name,
        direct_email,
        address1,
        address2,
        city,
        state,
        zip,
        phone,
        fax,
        specialization,
        practice_id,
        sales_rep_id,
        status_id,
        action_id,
        follow_up_date,
        follow_up_reason_id,
    } = payload;

    await pool.query(
        'CALL create_provider(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            npi ?? null,
            first_name,
            middle_name ?? null,
            last_name,
            direct_email ?? null,
            address1 ?? null,
            address2 ?? null,
            city,
            state,
            zip,
            phone ?? null,
            fax ?? null,
            specialization ?? null,
            practice_id,
            sales_rep_id ?? null,
            status_id ?? null,
            action_id ?? null,
            follow_up_date ?? null,
            follow_up_reason_id ?? null,
        ]
    );
}

export async function updateProvider(provider: Provider): Promise<void> {
    await pool.query(
        'CALL update_provider(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            provider.id,
            provider.npi ?? null,
            provider.first_name,
            provider.middle_name ?? null,
            provider.last_name,
            provider.direct_email ?? null,
            provider.address1 ?? null,
            provider.address2 ?? null,
            provider.city,
            provider.state,
            provider.zip,
            provider.phone ?? null,
            provider.fax ?? null,
            provider.specialization ?? null,
            provider.practice_id,
            provider.sales_rep_id ?? null,
            provider.status_id ?? null,
            provider.action_id ?? null,
            provider.follow_up_date ?? null,
            provider.follow_up_reason_id ?? null,
        ]
    );
}

export async function deleteProvider(provider_id: number): Promise<void> {
    await pool.query('CALL delete_provider(?)', [provider_id]);
}

export async function getProviders(params: {
    provider_id?: number;
    limit?: number;
    offset?: number;
}): Promise<Provider[]> {
    const { provider_id, limit = 50, offset = 0 } = params;
    const [rows] = await pool.query('CALL get_providers(?, ?, ?)', [
        provider_id ?? null,
        limit,
        offset,
    ]) as [Provider[], any];

    return rows;
}

export async function getProvidersByPracticeId(practice_id: number): Promise<Provider[]> {
    const [rows] = await pool.query('CALL get_providers_by_practice_id(?)', [practice_id]) as [Provider[], any];
    return rows;
}