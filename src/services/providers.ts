import { initDb } from "../db/client.js";
import { providers, practices, practiceLocations, locations, providerPracticeLocations, users, statuses, actions, followUpReasons, userFavorites } from "../db/schema.js";
import { eq, InferInsertModel, InferSelectModel, like, inArray, lt, and, gt, asc, desc, sql, SQL, count, is, or, BinaryOperator } from 'drizzle-orm';
import { MySqlColumn } from "drizzle-orm/mysql-core/index.js";

const db = initDb();

type ProvidersType = typeof providers;
export type InsertModel = InferInsertModel<ProvidersType>;
export type SelectModel = InferSelectModel<ProvidersType> & {
    favorite?: boolean;
};

export async function createProvider(payload: InsertModel): Promise<SelectModel> {
    const result = await db.insert(providers).values(payload);
    return (await db.select().from(providers).where(eq(providers.id, result[0].insertId)))[0];
}

export async function updateProvider(payload: SelectModel): Promise<SelectModel> {
    const { id, ...updateModel } = payload;
    await db.update(providers).set(updateModel).where(eq(providers.id, id));
    return (await db.select().from(providers).where(eq(providers.id, id)))[0];
}

export async function deleteProvider(providerId: number): Promise<void> {
    await db.delete(providers).where(eq(providers.id, providerId))
}

export async function getProvider(id: number, userId: number): Promise<SelectModel> {
    const results = await db.select({
        id: providers.id,
        npi: providers.npi,
        firstName: providers.firstName,
        middleName: providers.middleName,
        lastName: providers.lastName,
        suffix: providers.suffix,
        directEmail: providers.directEmail,
        specialization: providers.specialization,
        email: providers.email,
        salesRepId: providers.salesRepId,
        statusId: providers.statusId,
        actionId: providers.actionId,
        followUpDate: providers.followUpDate,
        followUpReasonId: providers.followUpReasonId,
        adminEmail: providers.adminEmail,
        adminName: providers.adminName,
        phone: providers.phone,
        favorite: sql<boolean>`CASE WHEN ${userFavorites.id} IS NOT NULL THEN true ELSE false END`
    })
        .from(providers)
        .leftJoin(userFavorites, and(
            eq(userFavorites.providerId, providers.id), 
            eq(userFavorites.userId, userId)
        ))
        .where(eq(providers.id, id));
    if (results.length > 0) return results[0];
    throw new Error('Provider not found!');
}

export type SearchResponseModel<T> = {
    paging: {
        pageNumber: number;
        pageSize: number;
        totalPages: number;
    }
    data: T[];
}
export type SearchParams = {
    npi?: string;
    firstName: string;
    middleName: string;
    lastName: string;
    directEmail: string;
    specializations?: string;
    status?: string;
    action?: string;
    followUpReason?: string;
    followUpDate?: Date | string;
    followUpOperator?: string;
    salesRep?: string;
    cities?: string;
    states?: string;
    sortField?: keyof typeof providers.$inferSelect | "cities" | "states";
    sortDir?: string;
    pageSize?: number;
    pageNumber?: number;
    providerIds: number[] | null;
    adminName?: string;
    favoritesOnly?: string;
    userId?: number;
};

export type SearchModel = {
    id: number;
    npi: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
    directEmail: string | null;
    specialization: string | null;
    salesRep: string | null;
    status: string | null;
    action: string | null;
    followUpDate: Date | null;
    followUpReason: string | null;
    // locations: string[] | null;
    cities: string[] | null;
    states: string[] | null;
}

export async function search(params: SearchParams): Promise<SearchResponseModel<SearchModel>> {
    const {
        npi,
        firstName,
        middleName,
        lastName,
        directEmail,
        specializations: pSpecializations,
        salesRep: pSalesReps,
        status: pStatuses,
        action: pActions,
        followUpDate,
        followUpOperator,
        followUpReason: pFollowUpReasons,
        cities,
        states,
        sortField = 'followUpDate',
        sortDir = 'asc',
        providerIds,
        adminName
    } = params;

    const pageSize = params.pageSize ? Number(params.pageSize) : 50;
    const pageNumber = params.pageNumber ? Number(params.pageNumber) : 1;

    const query = db.selectDistinct({
        id: providers.id,
        npi: providers.npi,
        firstName: providers.firstName,
        middleName: providers.middleName,
        lastName: providers.lastName,
        directEmail: providers.directEmail,
        specialization: providers.specialization,
        salesRep: (sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`) as SQL<string>,
        status: statuses.status,
        action: actions.action,
        followUpDate: providers.followUpDate,
        followUpReason: followUpReasons.reason,
        locations: sql`group_concat(distinct concat(${locations.city}, ', ',  ${locations.state}) SEPARATOR '|')` as SQL<string>
    }).from(providers)
        .leftJoin(users, eq(users.id, providers.salesRepId))
        .leftJoin(statuses, eq(statuses.id, providers.statusId))
        .leftJoin(actions, eq(actions.id, providers.actionId))
        .leftJoin(followUpReasons, eq(followUpReasons.id, providers.followUpReasonId))
        .leftJoin(providerPracticeLocations, eq(providerPracticeLocations.providerId, providers.id))
        .leftJoin(practiceLocations, eq(practiceLocations.id, providerPracticeLocations.practiceLocationId))
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .$dynamic();

    const countQuery = db.select({
        count: count()
    }).from(providers)
        .leftJoin(users, eq(users.id, providers.salesRepId))
        .leftJoin(statuses, eq(statuses.id, providers.statusId))
        .leftJoin(actions, eq(actions.id, providers.actionId))
        .leftJoin(followUpReasons, eq(followUpReasons.id, providers.followUpReasonId))
        .leftJoin(providerPracticeLocations, eq(providerPracticeLocations.providerId, providers.id))
        .leftJoin(practiceLocations, eq(practiceLocations.id, providerPracticeLocations.practiceLocationId))
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))

    if (params.favoritesOnly && params.favoritesOnly === 'true' && params.userId) {
        query.innerJoin(userFavorites, and(
            eq(userFavorites.userId, params.userId!),
            eq(userFavorites.providerId, providers.id)
        ));

        countQuery.innerJoin(userFavorites, and(
            eq(userFavorites.userId, params.userId!),
            eq(userFavorites.providerId, providers.id)
        ));
    }

    const whereConditions = [];

    // Apply filters
    if (npi) whereConditions.push(like(providers.npi, `%${npi}%`));
    if (firstName) whereConditions.push(like(providers.firstName, `%${firstName}%`));
    if (middleName) whereConditions.push(like(providers.middleName, `%${middleName}%`));
    if (lastName) whereConditions.push(like(providers.lastName, `%${lastName}%`));
    if (directEmail) whereConditions.push(like(providers.directEmail, `%${directEmail}%`));
    // Multi-select filter params (comma-separated ID strings)
        const statusIds = pStatuses
            ? pStatuses.split(',').map(Number).filter(n => !isNaN(n))
            : [];
        const actionIds = pActions
            ? pActions.split(',').map(Number).filter(n => !isNaN(n))
            : [];
        const followUpReasonIds = pFollowUpReasons
            ? pFollowUpReasons.split(',').map(Number).filter(n => !isNaN(n))
            : [];
        const specializations = pSpecializations ? pSpecializations.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
        const salesRepIds = pSalesReps
            ? pSalesReps.split(',').map(Number).filter(n => !isNaN(n))
            : [];
    
        if (statusIds.length > 0) whereConditions.push(inArray(practices.statusId, statusIds));
        if (actionIds.length > 0) whereConditions.push(inArray(practices.actionId, actionIds));
        if (followUpReasonIds.length > 0) whereConditions.push(inArray(practices.followUpReasonId, followUpReasonIds));
        if (specializations.length > 0) whereConditions.push(or(...specializations.map(s => eq(providers.specialization, s))));
        if (salesRepIds.length > 0) whereConditions.push(inArray(users.id, salesRepIds));
        // Dates
        if (followUpDate && followUpOperator && followUpDate instanceof Date) {
            let operator: BinaryOperator = eq;
            switch (followUpOperator) {
                case 'lt':
                    operator = lt;
                    break;
                case 'eq':
                    operator = eq;
                    break;
                case 'gt':
                    operator = gt;
                    break;
            }
            whereConditions.push(operator(practices.followUpDate, followUpDate))
        } else if (followUpDate && typeof followUpDate === 'string') {
            const parts = followUpDate.split(':');
            const mode = parts[0];
            if (mode === 'after') {
                whereConditions.push(gt(practices.followUpDate, new Date(parts[1])));
            } else if (mode === 'before') {
                whereConditions.push(lt(practices.followUpDate, new Date(parts[1])));
            } else if (mode === 'between') {
                const dates = parts[1].split(',');
                if (dates[0]) whereConditions.push(gt(practices.followUpDate, new Date(dates[0])));
                if (dates[1]) whereConditions.push(lt(practices.followUpDate, new Date(dates[1])));
            }
        }
    if (cities || states) {
        const locConditions = [];
        if (cities) locConditions.push(...cities.split(',').map(c => like(locations.city, `%${c.trim()}%`)));
        if (states) locConditions.push(...states.split(',').map(s => like(locations.state, `%${s.trim()}%`)));
        whereConditions.push(or(...locConditions));
    }
    if (providerIds && providerIds.length > 0) whereConditions.push(inArray(providers.id, providerIds));
    if (adminName) whereConditions.push(like(providers.adminName, `%${adminName}%`));

    query.where(and(...whereConditions));
    countQuery.where(and(...whereConditions));

    query.groupBy(providers.id);

    // Apply sorting
    const locationSortFields = ['locations', 'cities', 'states'];

    if (sortField && locationSortFields.includes(sortField)) {
        if (sortField === 'cities') {
            const expr = sql`MIN(${locations.city})`;
            query.orderBy(sortDir === 'asc' ? asc(expr) : desc(expr));
        } else if (sortField === 'states') {
            const expr = sql`MIN(${locations.state})`;
            query.orderBy(sortDir === 'asc' ? asc(expr) : desc(expr));
        }
    } else {
        // normal provider field sorting
        const col = providers[sortField as keyof typeof providers.$inferSelect];
        query.orderBy(sortDir === 'asc' ? asc(col) : desc(col));
    }   

    // Apply pagination
    if (pageSize > 0) query.limit(pageSize).offset((pageNumber - 1) * pageSize);

    const totalRecords: number = (await countQuery.execute())[0].count;

    const results = await query.execute();

    const response = results.map(item => {
        const cities: string[] = [], states: string[] = [];
        if (item.locations) {
            const locs = item.locations.split('|');
            locs.forEach((loc: string) => {
                const [city, state] = loc.split(',').map((s: string) => s.trim());
                if (city) cities.push(city);
                if (state) states.push(state);
            });
        }
        return {
            id: item.id,
            npi: item.npi,
            firstName: item.firstName,
            middleName: item.middleName,
            lastName: item.lastName,
            directEmail: item.directEmail,
            specialization: item.specialization,
            salesRep: item.salesRep,
            status: item.status,
            action: item.action,
            followUpDate: item.followUpDate,
            followUpReason: item.followUpReason,
            // locations: item.locations ? Array.from(new Set(item.locations.split('|').map((loc: string) => loc.trim()))) : null
            cities,
            states
        }
    })

    const resp = {
        paging: {
            pageNumber,
            pageSize,
            totalPages: totalRecords % pageSize === 0 ? (totalRecords / pageSize) : Math.floor(totalRecords / pageSize) + 1,
        },
        data: response
    };

    return resp;
}

export type ProviderPracticesSearchParams = {
    providerId: number;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    pageNumber?: number;
    pageSize?: number;
    sortField?: 'name' | 'phone' | 'address' | 'city' | 'state' | 'zip';
    sortDir?: 'asc' | 'desc';
}

export async function getProviderPractices(params: ProviderPracticesSearchParams) {
    const { 
        providerId, 
        name, 
        phone, 
        address, 
        city, 
        state, 
        zip, 
        sortField = 'name', 
        sortDir = 'asc' 
    } = params;

    const pageSize = params.pageSize ? Number(params.pageSize) : 50;
    const pageNumber = params.pageNumber ? Number(params.pageNumber) : 1;

    const query = db.select({
        id: practiceLocations.practiceId,
        practiceLocationId: practiceLocations.id,
        name: practices.name,
        phone: practiceLocations.phone,
        address: sql`CONCAT(${locations.address1}, ' ', COALESCE(${locations.address2}, ''))` as SQL<string>,
        city: locations.city,
        state: locations.state,
        zip: locations.zip,
        isPrimary: providerPracticeLocations.isPrimary
    })
    .from(providerPracticeLocations)
    .leftJoin(practiceLocations, eq(providerPracticeLocations.practiceLocationId, practiceLocations.id))
    .leftJoin(practices, eq(practiceLocations.practiceId, practices.id))
    .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
    .$dynamic();

    const countQuery = db.select({
        count: count()
    })
    .from(providerPracticeLocations)
    .leftJoin(practiceLocations, eq(providerPracticeLocations.practiceLocationId, practiceLocations.id))
    .leftJoin(practices, eq(practiceLocations.practiceId, practices.id))
    .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
    .$dynamic();

    const whereConditions = [
        eq(providerPracticeLocations.providerId, providerId)
    ];

    // Apply Filters
    if (name) whereConditions.push(like(practices.name, `%${name}%`));
    if (phone) whereConditions.push(like(practiceLocations.phone, `%${phone}%`));
    if (address) whereConditions.push(like(locations.address1, `%${address}%`));
    if (city) whereConditions.push(like(locations.city, `%${city}%`));
    if (state) whereConditions.push(eq(locations.state, state));
    if (zip) whereConditions.push(like(locations.zip, `%${zip}%`));

    query.where(and(...whereConditions));
    countQuery.where(and(...whereConditions));

    // Apply Sorting
    if (sortDir === 'asc') query.orderBy(asc(practices[sortField as keyof typeof practices] as MySqlColumn));
    else query.orderBy(desc(practices[sortField as keyof typeof practices] as MySqlColumn));

    // Apply Pagination
    if (pageSize > 0) query.limit(pageSize).offset((pageNumber - 1) * pageSize);

    const [totalRecords, results] = await Promise.all([
        (await countQuery.execute())[0].count,
        query.execute()
    ]);

    return {
        paging: {
            pageNumber,
            pageSize,
            totalPages: totalRecords % pageSize === 0 ? (totalRecords / pageSize) : Math.floor(totalRecords / pageSize) + 1,
        },
        data: results
    };
}

export async function getProviderFilterOptions() {
    const [statusesData, actionsData, followUpReasonsData, salesRepsData, specializationsData, statesData] = await Promise.all([
        db.select({
            value: statuses.id,
            label: statuses.status
        }).from(statuses).execute(),
        db.select({
            value: actions.id,
            label: actions.action
        }).from(actions).execute(),
        db.select({
            value: followUpReasons.id,
            label: followUpReasons.reason
        }).from(followUpReasons).execute(),
        db.select({ 
            value: users.id, 
            label: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})` 
        }).from(users).execute(),
        db.selectDistinct({
                value: providers.specialization,
                label: providers.specialization
            }).from(providers)
            .where(and(
                sql`${providers.specialization} IS NOT NULL`,
                sql`${providers.specialization} != ''`))
            .orderBy(asc(providers.specialization)),
        db.selectDistinct({
            value: locations.state, 
            label: locations.state
        }).from(locations).orderBy(asc(locations.state))
    ]);

    return {
        statuses: statusesData,
        actions: actionsData,
        followUpReasons: followUpReasonsData,
        salesReps: salesRepsData,
        specializations: specializationsData,
        states: statesData
    }
}