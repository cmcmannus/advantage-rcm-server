import { practiceLocations, locations, providerPracticeLocations, practices } from "../db/schema.js";
import { sql, eq, like, and, asc, desc, count, inArray, notInArray } from "drizzle-orm";
import { MySqlColumn } from "drizzle-orm/mysql-core/index.js";
import { initDb } from "../db/client.js";

const db = initDb();

// Common street type normalization map
const streetTypes: Record<string, string> = {
    st: 'Street',
    'st.': 'Street',
    street: 'Street',
    dr: 'Drive',
    'dr.': 'Drive',
    drive: 'Drive',
    rd: 'Road',
    'rd.': 'Road',
    road: 'Road',
    ave: 'Avenue',
    'ave.': 'Avenue',
    avenue: 'Avenue',
    blvd: 'Boulevard',
    'blvd.': 'Boulevard',
    boulevard: 'Boulevard',
    'blv': 'Boulevard',
    'blv.': 'Boulevard',
    ln: 'Lane',
    'ln.': 'Lane',
    lane: 'Lane',
    pl: 'Place',
    'pl.': 'Place',
    place: 'Place',
    'pt.': 'Point',
    pt: 'Point',
    point: 'Point',
    ct: 'Court',
    'ct.': 'Court',
    court: 'Court',
    'ste': 'Suite',
    'ste.': 'Suite',
    suite: 'Suite',
    'e.': 'East',
    e: 'East',
    east: 'East',
    'w.': 'West',
    w: 'West',
    west: 'West',
    'n.': 'North',
    n: 'North',
    north: 'North',
    's.': 'South',
    s: 'South',
    south: 'South',
    'hwy': 'Highway',
    'hwy.': 'Highway',
    highway: 'Highway',
    'pkwy': 'Parkway',
    'pkwy.': 'Parkway',
    parkway: 'Parkway',
    'trl': 'Trail',
    'trl.': 'Trail',
    trail: 'Trail',
    'bldg': 'Building',
    'bldg.': 'Building',
    building: 'Building',
    'dept': 'Department',
    'dept.': 'Department',
    department: 'Department',
    'fl': 'Floor',
    'fl.': 'Floor',
    floor: 'Floor',
    'apt': 'Apartment',
    'apt.': 'Apartment',
    apartment: 'Apartment',
    'rm': 'Room',
    'rm.': 'Room',
    room: 'Room',
    'unit': 'Unit',
    'unit.': 'Unit',
    'p.o.': 'P.O.',
    'po': 'P.O.',
    'p.o': 'P.O.',
    'pobox': 'P.O. Box',
};

// State variations to common 2-letter codes
const stateCodes: Record<string, string> = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY',
};

function normalizeStreetType(address: string): string {
    return address.replace(/\b(\w+)\.?/gi, (match, type) => {
        const normalized = streetTypes[type.toLowerCase()];
        return normalized || match;
    });
}

function normalizeCase(address: string): string {
    return address
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();
}

function normalizeAddress(address: string): string {
    let normalized = normalizeCase(address);
    normalized = normalizeStreetType(normalized);
    normalized = normalized.replace(/#\s(\w)/, '#$1');
    return normalized;
}

function normailizeLocation({ address1, address2, city, state }: { address1: string; address2?: string; city: string; state: string; }) {
    const normAddress1 = normalizeAddress(address1);
    const normAddress2 = address2 ? normalizeAddress(address2) : '';
    const normCity = normalizeCase(city);
    const normState = stateCodes[state.toLowerCase()] || state.toUpperCase();
    return {
        address1: normAddress1,
        address2: normAddress2,
        city: normCity,
        state: normState
    };
}

async function locationExists(address1: string, address2: string | undefined, city: string, state: string, zip: string) {
    const query = db.select().from(locations).where(
        and(
            eq(locations.address1, address1),
            eq(locations.city, city),
            eq(locations.state, state),
            eq(locations.zip, zip)
        )
    ).limit(1).$dynamic();

    if (address2) {
        query.where(and(eq(locations.address2, address2)));
    }

    const location = await query.execute();

    return location.length > 0 ? location[0] : null;
}

async function practiceLocationRecords(locationId: number) {
    return db.select().from(practiceLocations).where(
        eq(practiceLocations.locationId, locationId)
    ).execute();
};

async function getOrCreateLocation(address1: string, address2: string | undefined, city: string, state: string, zip: string) {
    const existingLocation = await locationExists(address1, address2, city, state, zip);
    if (existingLocation) {
        return existingLocation.id;
    } else {
        const result = await db.insert(locations).values({
            address1,
            address2,
            city,
            state,
            zip
        });
        return (result as any)[0].insertId;
    }
}

export type PracticeLocationsSearchParams = {
    practiceId?: number;
    practiceLocationId?: number;
    name?: string;
    phone?: string;
    fax?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    pageNumber?: number;
    pageSize?: number;
    sortField?: 'name' | 'address' | 'city' | 'state' | 'zip' | 'phone' | 'fax';
    sortDir?: 'asc' | 'desc';
}

export type CreatePracticeLocationParams = {
    practiceId: number;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    name?: string;
    phone?: string;
    fax?: string;
}

export async function getPracticeLocation(practiceLocationId: number) {
    return (await db.select({
        id: practiceLocations.id,
        name: practiceLocations.name,
        phone: practiceLocations.phone,
        fax: practiceLocations.fax,
        address: sql`CONCAT(${locations.address1},' ',COALESCE(${locations.address2},''))`,
        city: locations.city,
        state: locations.state,
        zip: locations.zip,
        address1: locations.address1,
        address2: locations.address2
    })
        .from(practiceLocations)
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .where(eq(practiceLocations.id, practiceLocationId))
        .limit(1)
        .execute())[0];
}

export async function getPracticeLocations(params: PracticeLocationsSearchParams) {
    const {
        practiceId,
        practiceLocationId,
        name,
        phone,
        fax,
        address,
        city,
        state,
        zip,
        sortField = 'name',
        sortDir = 'asc'
    } = params;

    const pageSize = params.pageSize ? Number(params.pageSize) : 25;
    const pageNumber = params.pageNumber ? Number(params.pageNumber) : 1;

    const query = db.selectDistinct({
        id: practiceLocations.id,
        name: practiceLocations.name,
        phone: practiceLocations.phone,
        fax: practiceLocations.fax,
        address: sql`CONCAT(${locations.address1},' ',COALESCE(${locations.address2},''))`,
        city: locations.city,
        state: locations.state,
        zip: locations.zip,
        address1: locations.address1,
        address2: locations.address2
    })
        .from(practiceLocations)
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .$dynamic();

    const countQuery = db.selectDistinct({
        count: count(practiceLocations.id)
    })
        .from(practiceLocations)
        .leftJoin(locations, eq(practiceLocations.locationId, locations.id))
        .$dynamic();

    const whereConditions = [];

    if (practiceId) whereConditions.push(eq(practiceLocations.practiceId, practiceId));
    if (practiceLocationId) whereConditions.push(eq(practiceLocations.id, practiceLocationId));

    // Apply filters
    if (name) whereConditions.push(like(practiceLocations.name, `%${name}%`));
    if (phone) whereConditions.push(like(practiceLocations.phone, `%${phone}%`));
    if (fax) whereConditions.push(like(practiceLocations.fax, `%${fax}%`));
    if (address) whereConditions.push(like(sql`CONCAT(${locations.address1},' ',COALESCE(${locations.address2},''))`, `%${address}%`));
    if (city) whereConditions.push(like(locations.city, `%${city}%`));
    if (state) whereConditions.push(eq(locations.state, state));
    if (zip) whereConditions.push(like(locations.zip, `%${zip}%`));

    query.where(and(...whereConditions));
    countQuery.where(and(...whereConditions));

    // Apply sorting
    if (sortField === 'address') {
        if (sortDir === 'asc') query.orderBy(asc(locations.address1), asc(locations.address2));
        else query.orderBy(desc(locations.address1), desc(locations.address2));
    } else {
        let table;
        // Determine sort table
        if (sortField in practiceLocations) {
            // Sort by practiceLocations table
            table = practiceLocations;
        } else {
            // Sort by locations table
            table = locations;
        }

        if (sortDir === 'asc') query.orderBy(asc(table[sortField as keyof typeof table] as MySqlColumn));
        else query.orderBy(desc(table[sortDir as keyof typeof table] as MySqlColumn));
    }

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

export async function createPracticeLocation({ address1, address2, practiceId, city, state, zip, phone, fax, name } :CreatePracticeLocationParams) {
    // Normalzed location
    const nl = normailizeLocation({ address1, address2, city, state });
    // Get or create a location based on normalized values we have
    const locationId = await getOrCreateLocation(nl.address1, nl.address2, nl.city, nl.state, zip);
    // Detertmine if practice location already exists for this practice and location
    let existing = db.select().from(practiceLocations)
        .limit(1)
        .$dynamic();

    const wheres = [];
    wheres.push(and(eq(practiceLocations.practiceId, practiceId)));
    wheres.push(and(eq(practiceLocations.locationId, locationId)));
    if (name) wheres.push(and(eq(practiceLocations.name, name)));
    if (phone) wheres.push(and(eq(practiceLocations.phone, phone?.replace(/[^0-9]/g, '').substring(0, 10))));
    if (fax) wheres.push(and(eq(practiceLocations.fax, fax?.replace(/[^0-9]/g, '').substring(0, 10))));
    existing.where(and(...wheres));
    const existingResults = await existing.execute();
    if (existingResults.length > 0) {
        return getPracticeLocation(existingResults[0].id);
    }
    // Insert new practice location record
    const result = await db.insert(practiceLocations).values({
        practiceId,
        locationId,
        name,
        phone: phone?.replace(/[^0-9]/g, '').substring(0, 10),
        fax: fax?.replace(/[^0-9]/g, '').substring(0, 10)
    });
    const newId = (result as any)[0].insertId;
    return getPracticeLocation(newId);
}

export async function updatePracticeLocation({ address1, address2, practiceLocationId, city, state, zip, phone, fax, name } :{practiceLocationId: number, address1: string, address2: string | undefined, city: string, state: string, zip: string, name?: string, phone?: string, fax?: string}) {
    const normalizedLocation = normailizeLocation({ address1, address2, city, state });
    const locationId = await getOrCreateLocation(normalizedLocation.address1, normalizedLocation.address2, normalizedLocation.city, normalizedLocation.state, zip);

    await db.update(practiceLocations).set({
        locationId: locationId,
        name,
        phone: phone?.replace(/[^0-9]/g, '').substring(0, 10),
        fax: fax?.replace(/[^0-9]/g, '').substring(0, 10)
    }).where(
        eq(practiceLocations.id, practiceLocationId)
    ).execute();

    return getPracticeLocation(practiceLocationId);
}

export async function deletePracticeLocation(practiceLocationId: number) {
    try {
        let [record] = await db.select().from(practiceLocations).where(
            eq(practiceLocations.id, practiceLocationId)
        ).limit(1).execute();
        if (!record) {
            throw new Error('Practice location not found.');
        }
        const records = await practiceLocationRecords(record.locationId);
        await db.delete(providerPracticeLocations).where(
            eq(providerPracticeLocations.practiceLocationId, practiceLocationId)
        ).execute();
        await db.delete(practiceLocations).where(
            eq(practiceLocations.id, practiceLocationId)
        ).execute();
        // If no other practice locations reference this location, delete it
        if (records.length === 1) {
            await db.delete(locations).where(
                eq(locations.id, record.locationId)
            ).execute();
        }
    } catch (ex) {
        throw new Error('Error deleting practice location.');
    }
}

export async function setProviderPrimaryLocation(providerId: number, practiceLocationId: number, set: boolean) {
    try {
        // Unset any existing primary location for this provider
        await db.update(providerPracticeLocations).set({
            isPrimary: 0
        }).where(
            eq(providerPracticeLocations.providerId, providerId)
        ).execute();

        // If set is passed, set the new primary location
        if (set) await db.update(providerPracticeLocations).set({
            isPrimary: 1
        }).where(
            and(
                eq(providerPracticeLocations.providerId, providerId),
                eq(providerPracticeLocations.practiceLocationId, practiceLocationId)
            )
        ).execute();
    } catch (ex) {
        throw new Error('Error setting primary location for provider.');
    }
}

export async function updateProviderPracticeLocations(providerId: number, practiceId: number, locationIds: number[]) {
    try {
        // Get all practice locations for the practice
        const practiceLocationRecords = await db.select().from(practiceLocations).where(
            eq(practiceLocations.practiceId, practiceId)
        ).execute();

        const practiceLocationIds = practiceLocationRecords.map(record => record.id);

        // Delete any providerPracticeLocation records for this provider that are not in the new locationIds and are part of this practice
        await db.delete(providerPracticeLocations).where(
            and(
                eq(providerPracticeLocations.providerId, providerId),
                // Only delete if the practiceLocationId is part of this practice
                (inArray(providerPracticeLocations.practiceLocationId, practiceLocationIds)),
                // Only delete if the practiceLocationId is NOT in the new locationIds
                (notInArray(providerPracticeLocations.practiceLocationId, locationIds))
            )
        ).execute();

        // Insert new providerPracticeLocation records for any locationIds that don't already exist for this provider and practice
        if (locationIds.length === 0) {
            return;
        }
        for (const locationId of locationIds) {
            const existing = await db.select().from(providerPracticeLocations).where(
                and(
                    eq(providerPracticeLocations.providerId, providerId),
                    eq(providerPracticeLocations.practiceLocationId, locationId)
                )
            ).limit(1).execute();

            if (existing.length === 0) {
                await db.insert(providerPracticeLocations).values({
                    providerId,
                    practiceLocationId: locationId,
                    isPrimary: 0
                }).execute();
            }
        }
    } catch (ex) {
        throw new Error('Error updating provider practice locations.');
    }
}