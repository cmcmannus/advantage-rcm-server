import { pool } from '../utils/db';
import { Practice } from '../../../shared/dist';

export async function createPractice(payload: Omit<Practice, 'id'>): Promise<void> {
    const {
        npi,
        name,
        address1,
        address2,
        city,
        state,
        zip,
        phone,
        fax,
        specialization,
        status_id,
        action_id,
        follow_up_date,
        follow_up_reason_id,
        ehr_system_id,
        pm_system_id,
    } = payload;

    await pool.query(
        'CALL create_practice(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            npi ?? null,
            name,
            address1 ?? null,
            address2 ?? null,
            city,
            state,
            zip,
            phone ?? null,
            fax ?? null,
            specialization ?? null,
            status_id ?? null,
            action_id ?? null,
            follow_up_date ?? null,
            follow_up_reason_id ?? null,
            ehr_system_id ?? null,
            pm_system_id ?? null,
        ]
    );
}

export async function updatePractice(practice: Practice): Promise<void> {
    await pool.query(
        'CALL update_practice(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            practice.id,
            practice.npi ?? null,
            practice.name,
            practice.address1 ?? null,
            practice.address2 ?? null,
            practice.city,
            practice.state,
            practice.zip,
            practice.phone ?? null,
            practice.fax ?? null,
            practice.specialization ?? null,
            practice.status_id ?? null,
            practice.action_id ?? null,
            practice.follow_up_date ?? null,
            practice.follow_up_reason_id ?? null,
            practice.ehr_system_id ?? null,
            practice.pm_system_id ?? null,
        ]
    );
}

export async function deletePractice(practice_id: number): Promise<void> {
    await pool.query('CALL delete_practice(?)', [practice_id]);
}

export async function getPractices(params: {
    practice_id?: number;
    limit?: number;
    offset?: number;
}): Promise<Practice[]> {
    const { practice_id, limit = 50, offset = 0 } = params;
    const [rows] = await pool.query('CALL get_practices(?, ?, ?)', [
        practice_id ?? null,
        limit,
        offset,
    ]) as [Practice[], any];

    return rows;
}