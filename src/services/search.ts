import { sql, eq } from 'drizzle-orm';
import { practices, providers, statuses, actions, followUpReasons, users, practiceLocations, locations, providerPracticeLocations } from '../db/schema.js';
import { initDb } from '../db/client.js';

const db = initDb();

type SearchParams = {
    searchText?: string;
    statusId?: number;
    actionId?: number;
    followUpReasonId?: number;
    salesRepId?: number;
    limit?: number;
    offset?: number;
};

export async function searchPracticeProvider(params: SearchParams) {
    const {
        searchText = null,
        statusId = null,
        actionId = null,
        followUpReasonId = null,
        salesRepId = null,
        limit = 50,
        offset = 0,
    } = params;

    // PRACTICE query
    const practiceQuery = db
        .selectDistinct({
            record_id: practices.id,
            record_type: sql.raw(`'practice'`),
            primary_name: practices.name,
            npi: practices.npi,
            specialization: practices.specialization,
            city: locations.city,
            state: locations.state,
            status: statuses.status,
            action: actions.action,
            follow_up_reason: followUpReasons.reason,
            sales_rep: sql.raw('NULL'),
        })
        .from(practices)
        .leftJoin(statuses, eq(practices.statusId, statuses.id))
        .leftJoin(actions, eq(practices.actionId, actions.id))
        .leftJoin(followUpReasons, eq(practices.followUpReasonId, followUpReasons.id))
        .leftJoin(practiceLocations, eq(practiceLocations.practiceId, practices.id))
        .leftJoin(locations, eq(locations.id, practiceLocations.locationId))
        .where(sql`(${statusId} IS NULL OR ${practices.statusId} = ${statusId})
      AND (${actionId} IS NULL OR ${practices.actionId} = ${actionId})
      AND (${followUpReasonId} IS NULL OR ${practices.followUpReasonId} = ${followUpReasonId})
      ${searchText ? sql`AND (
        LOWER(${practices.name}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${practices.specialization}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${locations.city}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${locations.state}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${practices.npi}) LIKE LOWER(${'%' + searchText + '%'})
        )` : sql``}
    `)
        .limit(limit)
        .offset(offset);

    // PROVIDER query
    const providerQuery = db
        .selectDistinct({
            record_id: providers.id,
            record_type: sql.raw(`'provider'`),
            primary_name: sql`CONCAT_WS(' ', ${providers.firstName}, ${providers.middleName}, ${providers.lastName})`,
            npi: providers.npi,
            specialization: providers.specialization,
            city: locations.city,
            state: locations.state,
            status: statuses.status,
            action: actions.action,
            follow_up_reason: followUpReasons.reason,
            sales_rep: sql`CONCAT_WS(' ', ${users.firstName}, ${users.lastName})`
        })
        .from(providers)
        .leftJoin(providerPracticeLocations, eq(providerPracticeLocations.providerId, providers.id))
        .leftJoin(practiceLocations, eq(practiceLocations.id, providerPracticeLocations.practiceLocationId))
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .leftJoin(users, eq(providers.salesRepId, users.id))
        .leftJoin(statuses, eq(providers.statusId, statuses.id))
        .leftJoin(actions, eq(providers.actionId, actions.id))
        .leftJoin(followUpReasons, eq(providers.followUpReasonId, followUpReasons.id))
        .where(sql`(${statusId} IS NULL OR ${providers.statusId} = ${statusId})
      AND (${actionId} IS NULL OR ${providers.actionId} = ${actionId})
      AND (${followUpReasonId} IS NULL OR ${providers.followUpReasonId} = ${followUpReasonId})
      AND (${salesRepId} IS NULL OR ${providers.salesRepId} = ${salesRepId})
      ${searchText ? sql`AND (
        LOWER(${providers.firstName}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${providers.middleName}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${providers.lastName}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${providers.specialization}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${locations.city}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${locations.state}) LIKE LOWER(${'%' + searchText + '%'}) OR
        LOWER(${providers.npi}) LIKE LOWER(${'%' + searchText + '%'}))` : 
      sql``}`)
        .limit(limit)
        .offset(offset);

    const [practiceResults, providerResults] = await Promise.all([
        practiceQuery,
        providerQuery,
    ]);

    return [...practiceResults, ...providerResults];
}
