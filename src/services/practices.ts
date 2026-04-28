import { initDb } from "../db/client.js";
import { practices, practiceLocations, locations, providerPracticeLocations, providers, statuses, actions, followUpReasons, ehrSystems, pmSystems, userFavorites } from "../db/schema.js";
import { eq, InferInsertModel, InferSelectModel, like, inArray, lt, BinaryOperator, gt, asc, desc, sql, count, and, notExists, notInArray, exists } from 'drizzle-orm';
import { MySqlColumn } from "drizzle-orm/mysql-core/index.js";
import { SearchResponseModel } from "./providers.js";

const db = initDb();

export type InsertModel = InferInsertModel<typeof practices>;
export type SelectModel = InferSelectModel<typeof practices>;

export async function createPractice(payload: InsertModel): Promise<number> {
    const result = await db.insert(practices).values(payload);
    return result[0].insertId;
}

export async function updatePractice(payload: SelectModel): Promise<SelectModel> {
    const { id, ...updateModel } = payload;
    await db.update(practices).set(updateModel).where(eq(practices.id, id));
    return payload;
}

export async function deletePractice(practiceId: number): Promise<void> {
    await db.delete(practices).where(eq(practices.id, practiceId))
}

export async function getPractice(id: number, userId: number): Promise<SelectModel> {
    const results = await db.select({
        id: practices.id,
        npi: practices.npi,
        name: practices.name,
        specialization: practices.specialization,
        statusId: practices.statusId,
        actionId: practices.actionId,
        followUpDate: practices.followUpDate,
        followUpReasonId: practices.followUpReasonId,
        ehrSystemId: practices.ehrSystemId,
        pmSystemId: practices.pmSystemId,
        favorite: sql<boolean>`CASE WHEN ${userFavorites.id} IS NOT NULL THEN true ELSE false END`
    })
        .from(practices)
        .leftJoin(userFavorites, and(
            eq(userFavorites.practiceId, practices.id),
            eq(userFavorites.userId, userId)
        ))
        .where(eq(practices.id, id));
    
    if (results.length > 0) return results[0];
    throw new Error('Practice not found!');
}

export type SearchParams = {
    npi?: string;
    name?: string;
    specialization?: string;
    statusIds?: number[];
    actionIds?: number[];
    followUpDate?: Date;
    followUpOperator?: string;
    followUpReasonIds?: number[];
    ehrSystemIds?: number[];
    pmSystemIds?: number[];
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    practiceIds?: string[];
    favoritesOnly?: string;
    sortField: keyof typeof practices.$inferSelect;
    sortDir: string;
    pageSize?: number;
    pageNumber?: number;
    userId?: number; // needed for favorites filtering
};

export type SearchResponse = {
    id: number;
    npi: string | null;
    name: string;
    specialization: string | null;
    status: string | null;
    action: string | null;
    followUpDate: Date | null;
    followUpReason: string | null;
    ehrSystem: string | null;
    pmSystem: string | null;
};

export async function search(params: SearchParams): Promise<SearchResponseModel<SearchResponse>> {
    const { 
        npi, 
        name, 
        specialization, 
        statusIds, 
        actionIds, 
        followUpDate, 
        followUpOperator, 
        followUpReasonIds, 
        ehrSystemIds, 
        pmSystemIds,
        address,
        city,
        state,
        zip,
        practiceIds,
        sortField = 'name', 
        sortDir = 'asc', 
    } = params;

    const pageSize = params.pageSize ? Number(params.pageSize) : 50;
    const pageNumber = params.pageNumber ? Number(params.pageNumber) : 1;

    const query = db.selectDistinct({
        id: practices.id,
        npi: practices.npi,
        name: practices.name,
        specialization: practices.specialization,
        statusId: practices.statusId,
        status: statuses.status,
        actionId: practices.actionId,
        action: actions.action,
        followUpDate: practices.followUpDate,
        followUpReasonId: practices.followUpReasonId,
        followUpReason: followUpReasons.reason,
        ehrSystemId: practices.ehrSystemId,
        ehrSystem: ehrSystems.systemName,
        pmSystemId: practices.pmSystemId,
        pmSystem: pmSystems.systemName
    }).from(practices)
        .leftJoin(statuses, eq(practices.statusId, statuses.id))
        .leftJoin(actions, eq(practices.actionId, actions.id))
        .leftJoin(followUpReasons, eq(practices.followUpReasonId, followUpReasons.id))
        .leftJoin(ehrSystems, eq(practices.ehrSystemId, ehrSystems.id))
        .leftJoin(pmSystems, eq(practices.pmSystemId, pmSystems.id))
        .leftJoin(practiceLocations, eq(practiceLocations.practiceId, practices.id))
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .$dynamic();

    // Count query
    const countQuery = db.selectDistinct({
        count: count(practices.id)
    }).from(practices)
        .leftJoin(statuses, eq(practices.statusId, statuses.id))
        .leftJoin(actions, eq(practices.actionId, actions.id))
        .leftJoin(followUpReasons, eq(practices.followUpReasonId, followUpReasons.id))
        .leftJoin(ehrSystems, eq(practices.ehrSystemId, ehrSystems.id))
        .leftJoin(pmSystems, eq(practices.pmSystemId, pmSystems.id))
        .leftJoin(practiceLocations, eq(practiceLocations.practiceId, practices.id))
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .$dynamic();

    if (params.favoritesOnly && params.favoritesOnly === 'true' && params.userId) {
        query.innerJoin(userFavorites, and(
            eq(userFavorites.userId, params.userId!),
            eq(userFavorites.practiceId, practices.id)
        ));

        countQuery.innerJoin(userFavorites, and(
            eq(userFavorites.practiceId, practices.id),
            eq(userFavorites.userId, params.userId!)
        ));
    }

    const whereConditions = [];

    // Strings
    if (npi) whereConditions.push(like(practices.npi, `%${npi}%`));
    if (name) whereConditions.push(like(practices.name, `%${name}%`));
    if (specialization) whereConditions.push(like(practices.specialization, `%${specialization}%`));
    if (address) whereConditions.push(like(locations.address1, address)), whereConditions.push(like(locations.address2, address));
    if (city) whereConditions.push(like(locations.city, city));
    if (state) whereConditions.push(eq(locations.state, state));
    if (zip) whereConditions.push(like(locations.zip, zip));
    // Arrays
    if (statusIds) whereConditions.push(inArray(practices.statusId, statusIds));
    if (actionIds) whereConditions.push(inArray(practices.actionId, actionIds));
    if (followUpReasonIds) whereConditions.push(inArray(practices.followUpReasonId, followUpReasonIds));
    if (ehrSystemIds) whereConditions.push(inArray(practices.ehrSystemId, ehrSystemIds));
    if (pmSystemIds) whereConditions.push(inArray(practices.pmSystemId, pmSystemIds));
    if (practiceIds) whereConditions.push(inArray(practices.id, practiceIds.map(id => Number(id))));
    // Dates
    if (followUpDate && followUpOperator) {
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
    }

    query.where(and(...whereConditions));
    countQuery.where(and(...whereConditions));

    // Apply sorting
    query.orderBy(sortDir === 'asc' ? asc(practices[sortField]) : desc(practices[sortField]));

    // Apply paging
    if (pageSize > 0) {
        query.limit(pageSize).offset((pageNumber - 1) * pageSize);
    }

    const totalRecords: number = (await countQuery.execute())[0].count;

    const results = await query;

    const response: SearchResponse[] = [];
    
    results.forEach(practice => {
        if (practice) {
            response.push({
                id: practice.id,
                npi: practice.npi,
                name: practice.name,
                specialization: practice.specialization,
                status: practice.status,
                action: practice.action,
                followUpDate: practice.followUpDate,
                followUpReason: practice.followUpReason,
                ehrSystem: practice.ehrSystem,
                pmSystem: practice.pmSystem
            });
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

export async function getPracticesForDdl(query?: string): Promise<{ value: number; label: string }[]> {
    let whereClause = undefined;
    if (query) {
        whereClause = like(practices.name, `%${query}%`);
    }

    const results = await db.select({
        value: practices.id,
        label: practices.name
    })
    .from(practices)
    .where(whereClause)
    .orderBy(asc(practices.name))
    .limit(25);

    return results;
}

export async function getProvidersAvailableForPractice(practiceId: number, providerName?: string): Promise<{ value: number; label: string }[]> {
    const associatedProviders = db.selectDistinct({
        providerId: providerPracticeLocations.providerId
    })
    .from(providerPracticeLocations)
    .innerJoin(practiceLocations, eq(providerPracticeLocations.practiceLocationId, practiceLocations.id))
    .where(eq(practiceLocations.practiceId, practiceId));

    const results = await db.select({
        value: providers.id,
        label: sql<string>`CONCAT(${providers.firstName}, ' ', ${providers.lastName})`
    })
    .from(providers)
    .where(and(
        notInArray(providers.id, associatedProviders),
        providerName ? like(sql<string>`CONCAT(${providers.firstName}, ' ', ${providers.lastName})`, `%${providerName}%`) : undefined
    ))
    .orderBy(asc(providers.lastName))
    .limit(50);

    return results;
}

export type PracticeProvidersSearchParams = {
    practiceId: number;
    npi?: string;
    firstName?: string;
    lastName?: string;
    specialization?: string;
    pageNumber?: number;
    pageSize?: number;
    sortField?: 'npi' | 'firstName' | 'lastName' | 'specialization';
    sortDir?: 'asc' | 'desc';
}

export async function getPracticeProviders(params: PracticeProvidersSearchParams) {
    const { 
        practiceId, 
        npi, 
        firstName, 
        lastName, 
        specialization, 
        sortField = 'lastName', 
        sortDir = 'asc' 
    } = params;

    const pageSize = params.pageSize ? Number(params.pageSize) : 25;
    const pageNumber = params.pageNumber ? Number(params.pageNumber) : 1;

    const query = db.selectDistinct({
        id: providers.id,
        // practiceLocationId: practiceLocations.id,
        npi: providers.npi,
        firstName: providers.firstName,
        lastName: providers.lastName,
        specialization: providers.specialization
    })
    .from(providers)
    .leftJoin(providerPracticeLocations, eq(providerPracticeLocations.providerId, providers.id))
    .leftJoin(practiceLocations, eq(providerPracticeLocations.practiceLocationId, practiceLocations.id))
    .$dynamic();

    const countQuery = db.select({
        count: count(practiceLocations.id)  
    })
    .from(providers)
    .leftJoin(providerPracticeLocations, eq(providerPracticeLocations.providerId, providers.id))
    .leftJoin(practiceLocations, eq(providerPracticeLocations.practiceLocationId, practiceLocations.id))
    .$dynamic();

    const whereConditions = [
        eq(practiceLocations.practiceId, practiceId)
    ];

    // Apply Filters
    if (npi) whereConditions.push(like(providers.npi, `%${npi}%`));
    if (firstName) whereConditions.push(like(providers.firstName, `%${firstName}%`));
    if (lastName) whereConditions.push(like(providers.lastName, `%${lastName}%`));
    if (specialization) whereConditions.push(like(providers.specialization, `%${specialization}%`));

    query.where(and(...whereConditions));
    countQuery.where(and(...whereConditions));

    // Apply sorting
    if (sortDir === 'asc') query.orderBy(asc(providers[sortField as keyof typeof providers] as MySqlColumn));
    else query.orderBy(desc(providers[sortField as keyof typeof providers] as MySqlColumn));

    // Apply paging
    if (pageSize > 0) {
        query.limit(pageSize).offset((pageNumber - 1) * pageSize);
    }

    const [totalRecords, results] = await Promise.all([
        (await countQuery.execute())[0].count,
        query
    ]);

    return {
        data: results,
        paging: {
            pageNumber,
            pageSize,
            totalPages: totalRecords % pageSize === 0 ? (totalRecords / pageSize) : Math.floor(totalRecords / pageSize) + 1,
        }
    };
}
