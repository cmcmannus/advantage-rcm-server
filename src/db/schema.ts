import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, int, varchar, char, index, foreignKey, date, text, tinyint, datetime } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const actions = mysqlTable("actions", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	action: varchar({ length: 45 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "actions_id"}),
	unique("action_UNIQUE").on(table.action),
]);

export const clearingHouses = mysqlTable("clearing_houses", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	clearingHouseName: varchar("clearing_house_name", { length: 45 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "clearing_houses_id"}),
	unique("clearing_house_name_UNIQUE").on(table.clearingHouseName),
	unique("id_UNIQUE").on(table.id),
]);

export const ehrSystems = mysqlTable("ehr_systems", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	systemName: varchar("system_name", { length: 45 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "ehr_systems_id"}),
	unique("id_UNIQUE").on(table.id),
	unique("system_name_UNIQUE").on(table.systemName),
]);

export const followUpReasons = mysqlTable("follow_up_reasons", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	reason: varchar({ length: 45 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "follow_up_reasons_id"}),
	unique("reason_UNIQUE").on(table.reason),
]);

export const locations = mysqlTable("locations", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	address1: varchar("address_1", { length: 100 }).notNull(),
	address2: varchar("address_2", { length: 100 }),
	city: varchar({ length: 100 }).notNull(),
	state: char({ length: 2 }).notNull(),
	zip: char({ length: 5 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "locations_id"}),
	unique("id_UNIQUE").on(table.id),
]);

export const notes = mysqlTable("notes", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	practiceId: int("practice_id", { unsigned: true }).references(() => practices.id),
	providerId: int("provider_id", { unsigned: true }).references(() => providers.id),
	userId: int("user_id", { unsigned: true }).notNull().references(() => users.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	timestamp: datetime({ mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	note: text().notNull(),
},
(table) => [
	index("practice_id").on(table.practiceId),
	index("provider_id").on(table.providerId),
	primaryKey({ columns: [table.id], name: "notes_id"}),
	unique("id_UNIQUE").on(table.id),
]);

export const pmSystems = mysqlTable("pm_systems", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	systemName: varchar("system_name", { length: 45 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "pm_systems_id"}),
	unique("system_name_UNIQUE").on(table.systemName),
]);

export const practiceLocations = mysqlTable("practice_locations", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	practiceId: int("practice_id", { unsigned: true }).notNull().references(() => practices.id),
	locationId: int("location_id", { unsigned: true }).notNull().references(() => locations.id),
	name: varchar({ length: 255 }),
	phone: varchar({ length: 10 }),
	fax: varchar({ length: 10 }),
},
(table) => [
	index("fk_practice_locations_location_id_idx").on(table.locationId),
	index("fk_practice_locations_practice_id_idx").on(table.practiceId),
	primaryKey({ columns: [table.id, table.practiceId, table.locationId], name: "practice_locations_id_practice_id_location_id"}),
	unique("id_UNIQUE").on(table.id),
]);

export const practices = mysqlTable("practices", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	npi: varchar({ length: 10 }),
	name: varchar({ length: 100 }).notNull(),
	specialization: varchar({ length: 255 }),
	statusId: int("status_id", { unsigned: true }).references(() => statuses.id),
	actionId: int("action_id", { unsigned: true }).references(() => actions.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	followUpDate: date("follow_up_date", { mode: 'date' }),
	followUpReasonId: int("follow_up_reason_id", { unsigned: true }).references(() => followUpReasons.id),
	ehrSystemId: int("ehr_system_id", { unsigned: true }).references(() => ehrSystems.id),
	pmSystemId: int("pm_system_id", { unsigned: true }).references(() => pmSystems.id),
},
(table) => [
	index("action").on(table.actionId),
	index("ehr_system").on(table.ehrSystemId),
	index("fk_practice_follow_up_reason_idx").on(table.followUpReasonId),
	index("name").on(table.name, table.specialization, table.npi),
	index("pm_system").on(table.pmSystemId),
	index("specialization").on(table.specialization),
	index("status").on(table.statusId),
	primaryKey({ columns: [table.id], name: "practices_id"}),
	unique("id_UNIQUE").on(table.id),
	unique("name_UNIQUE").on(table.name),
	unique("NPI_UNIQUE").on(table.npi),
]);

export const providerPracticeLocations = mysqlTable("provider_practice_locations", {
	providerId: int("provider_id").notNull(),
	practiceLocationId: int("practice_location_id", { unsigned: true }).notNull().references(() => practiceLocations.id),
	isPrimary: tinyint("is_primary", { unsigned: true }).default(0).notNull(),
},
(table) => [
	index("fk_provider_practice_locations_practice_location_id_idx").on(table.practiceLocationId),
	index("fk_provider_practice_locations_provider_id_idx").on(table.providerId),
	primaryKey({ columns: [table.providerId, table.practiceLocationId], name: "provider_practice_locations_provider_id_practice_location_id"}),
]);

export const providers = mysqlTable("providers", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	npi: varchar({ length: 10 }),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	middleName: varchar("middle_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	directEmail: varchar("direct_email", { length: 255 }),
	email: varchar({ length: 255 }),
	adminName: varchar("admin_name", { length: 255 }),
	adminEmail: varchar("admin_email", { length: 255 }),
	specialization: varchar({ length: 255 }),
	salesRepId: int("sales_rep_id", { unsigned: true }).references(() => users.id),
	statusId: int("status_id", { unsigned: true }).references(() => statuses.id),
	actionId: int("action_id", { unsigned: true }).references(() => actions.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	followUpDate: date("follow_up_date", { mode: 'date' }),
	followUpReasonId: int("follow_up_reason_id", { unsigned: true }).references(() => followUpReasons.id),
},
(table) => [
	index("action").on(table.actionId),
	index("first_name").on(table.firstName, table.middleName, table.lastName, table.specialization, table.npi),
	index("follow_up_reason").on(table.followUpReasonId),
	index("sales_rep").on(table.salesRepId),
	index("status").on(table.statusId),
	primaryKey({ columns: [table.id], name: "providers_id"}),
	unique("NPI_UNIQUE").on(table.npi),
]);

export const statuses = mysqlTable("statuses", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	status: varchar({ length: 45 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "statuses_id"}),
	unique("status_UNIQUE").on(table.status),
]);

export const users = mysqlTable("users", {
	id: int({ unsigned: true }).autoincrement().notNull(),
	email: varchar({ length: 254 }).notNull(),
	password: char({ length: 60 }).notNull(),
	resetToken: varchar("reset_token", { length: 45 }),
	resetTokenExpiration: datetime("reset_token_expiration", { mode: 'date'}),
	firstName: varchar("first_name", { length: 45 }).notNull(),
	lastName: varchar("last_name", { length: 45 }).notNull(),
	salesRep: tinyint("sales_rep").default(0).notNull(),
	accessLevel: tinyint("access_level", { unsigned: true }).default(2).notNull(),
	active: tinyint().default(1).notNull(),
	created: datetime({ mode: 'date'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updated: datetime({ mode: 'date'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("email_UNIQUE").on(table.email),
	unique("reset_token_UNIQUE").on(table.resetToken),
]);
