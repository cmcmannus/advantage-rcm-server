import { initDb } from "../db/client.js";
import { providers, practices, practiceLocations, locations, providerPracticeLocations, users, statuses, actions, followUpReasons } from "../db/schema.js";
import { eq, InferInsertModel, InferSelectModel, like, inArray, lt, and, gt, asc, desc, sql, SQL, count } from 'drizzle-orm';
import { MySqlColumn } from "drizzle-orm/mysql-core/index.js";

const db = initDb();

type ProvidersType = typeof providers;
export type InsertModel = InferInsertModel<ProvidersType>;
export type SelectModel = InferSelectModel<ProvidersType>;
export type SearchParams = {
    npi?: string;
    firstName: string;
    middleName: string;
    lastName: string;
    directEmail: string;
    specialization?: string;
    salesRepId: number,
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
    sortField?: keyof typeof providers.$inferSelect;
    sortDir?: string;
    pageSize?: number;
    pageNumber?: number;
    providerIds: number[] | null;
    adminName?: string;
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

export async function getProvider(id: number): Promise<SelectModel> {
    const results = await db.select().from(providers).where(eq(providers.id, id));
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
    // address: string | null;
    // city: string | null;
    // state: string | null;
    // zip: string | null;
}

export async function search(params: SearchParams): Promise<SearchResponseModel<SearchModel>> {
    const {
        npi,
        firstName,
        middleName,
        lastName,
        directEmail,
        specialization,
        salesRepId,
        statusIds,
        actionIds,
        followUpDate,
        followUpOperator,
        followUpReasonIds,
        address,
        city,
        state,
        zip,
        sortField = 'followUpDate',
        sortDir = 'asc',
        providerIds,
        adminName
    } = params;

    const pageSize = params.pageSize ? Number(params.pageSize) : 50;
    const pageNumber = params.pageNumber ? Number(params.pageNumber) : 1;

    const query = db.select({
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
        // address: (sql`CONCAT(${locations.address1}, ' ', ${locations.address2})`) as SQL<string>, // Combine address1 and address2
        // city: locations.city,
        // state: locations.state,
        // zip: locations.zip,
    }).from(providers)
        .leftJoin(users, eq(users.id, providers.salesRepId))
        .leftJoin(statuses, eq(statuses.id, providers.statusId))
        .leftJoin(actions, eq(actions.id, providers.actionId))
        .leftJoin(followUpReasons, eq(followUpReasons.id, providers.followUpReasonId))
        // .leftJoin(providerPracticeLocations, eq(providerPracticeLocations.providerId, providers.id))
        // .leftJoin(practiceLocations, eq(practiceLocations.practiceId, providerPracticeLocations.providerId))
        // .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .$dynamic();

    const countQuery = db.select({
        count: count()
    }).from(providers)
        .leftJoin(users, eq(users.id, providers.salesRepId))
        .leftJoin(statuses, eq(statuses.id, providers.statusId))
        .leftJoin(actions, eq(actions.id, providers.actionId))
        .leftJoin(followUpReasons, eq(followUpReasons.id, providers.followUpReasonId))
        // .leftJoin(providerPracticeLocations, eq(providerPracticeLocations.providerId, providers.id))
        // .leftJoin(practiceLocations, eq(practiceLocations.practiceId, providerPracticeLocations.providerId))
        // .leftJoin(locations, eq(practiceLocations.locationId, locations.id))

    const whereConditions = [];

    // Apply filters
    if (npi) whereConditions.push(like(providers.npi, `%${npi}%`));
    if (firstName) whereConditions.push(like(providers.firstName, `%${firstName}%`));
    if (middleName) whereConditions.push(like(providers.middleName, `%${middleName}%`));
    if (lastName) whereConditions.push(like(providers.lastName, `%${lastName}%`));
    if (directEmail) whereConditions.push(like(providers.directEmail, `%${directEmail}%`));
    if (specialization) whereConditions.push(like(providers.specialization, `%${specialization}%`));
    if (salesRepId) whereConditions.push(eq(providers.salesRepId, salesRepId));
    if (statusIds && statusIds.length > 0) whereConditions.push(inArray(providers.statusId, statusIds));
    if (actionIds && actionIds.length > 0) whereConditions.push(inArray(providers.actionId, actionIds));
    if (followUpDate && followUpOperator) {
        const operator = followUpOperator === '>' ? gt : followUpOperator === '<' ? lt : eq;
        whereConditions.push(operator(providers.followUpDate, followUpDate));
    }
    if (followUpReasonIds && followUpReasonIds.length > 0) whereConditions.push(inArray(providers.followUpReasonId, followUpReasonIds));
    // if (address) {
    //     whereConditions.push(like(locations.address1, `%${address}%`));
    //     whereConditions.push(like(locations.address2, `%${address}%`));
    // }
    // if (city) whereConditions.push(like(locations.city, `%${city}%`));
    // if (state) whereConditions.push(eq(locations.state, state));
    // if (zip) whereConditions.push(like(locations.zip, `%${zip}%`));
    if (providerIds && providerIds.length > 0) whereConditions.push(inArray(providers.id, providerIds));
    if (adminName) whereConditions.push(like(providers.adminName, `%${adminName}%`));

    query.where(and(...whereConditions));
    countQuery.where(and(...whereConditions));

    // Apply sorting
    if (sortDir === 'asc') query.orderBy(asc(providers[sortField]));
    else query.orderBy(desc(providers[sortField]));

    // Apply pagination
    if (pageSize > 0) query.limit(pageSize).offset((pageNumber - 1) * pageSize);

    const totalRecords: number = (await countQuery.execute())[0].count;

    const resp = {
        paging: {
            pageNumber,
            pageSize,
            totalPages: totalRecords % pageSize === 0 ? (totalRecords / pageSize) : Math.floor(totalRecords / pageSize) + 1,
        },
        data: await query.execute()
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
        zip: locations.zip
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