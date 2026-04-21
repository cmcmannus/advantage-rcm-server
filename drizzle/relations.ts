import { relations } from "drizzle-orm/relations";
import { practices, notes, providers, users, locations, practiceLocations, actions, ehrSystems, followUpReasons, pmSystems, statuses, providerPracticeLocations, userFavorites } from "./schema";

export const notesRelations = relations(notes, ({one}) => ({
	practice: one(practices, {
		fields: [notes.practiceId],
		references: [practices.id]
	}),
	provider: one(providers, {
		fields: [notes.providerId],
		references: [providers.id]
	}),
	user: one(users, {
		fields: [notes.userId],
		references: [users.id]
	}),
}));

export const practicesRelations = relations(practices, ({one, many}) => ({
	notes: many(notes),
	practiceLocations: many(practiceLocations),
	action: one(actions, {
		fields: [practices.actionId],
		references: [actions.id]
	}),
	ehrSystem: one(ehrSystems, {
		fields: [practices.ehrSystemId],
		references: [ehrSystems.id]
	}),
	followUpReason: one(followUpReasons, {
		fields: [practices.followUpReasonId],
		references: [followUpReasons.id]
	}),
	pmSystem: one(pmSystems, {
		fields: [practices.pmSystemId],
		references: [pmSystems.id]
	}),
	status: one(statuses, {
		fields: [practices.statusId],
		references: [statuses.id]
	}),
	userFavorites: many(userFavorites),
}));

export const providersRelations = relations(providers, ({one, many}) => ({
	notes: many(notes),
	action: one(actions, {
		fields: [providers.actionId],
		references: [actions.id]
	}),
	followUpReason: one(followUpReasons, {
		fields: [providers.followUpReasonId],
		references: [followUpReasons.id]
	}),
	user: one(users, {
		fields: [providers.salesRepId],
		references: [users.id]
	}),
	status: one(statuses, {
		fields: [providers.statusId],
		references: [statuses.id]
	}),
	userFavorites: many(userFavorites),
}));

export const usersRelations = relations(users, ({many}) => ({
	notes: many(notes),
	providers: many(providers),
	userFavorites: many(userFavorites),
}));

export const practiceLocationsRelations = relations(practiceLocations, ({one, many}) => ({
	location: one(locations, {
		fields: [practiceLocations.locationId],
		references: [locations.id]
	}),
	practice: one(practices, {
		fields: [practiceLocations.practiceId],
		references: [practices.id]
	}),
	providerPracticeLocations: many(providerPracticeLocations),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	practiceLocations: many(practiceLocations),
}));

export const actionsRelations = relations(actions, ({many}) => ({
	practices: many(practices),
	providers: many(providers),
}));

export const ehrSystemsRelations = relations(ehrSystems, ({many}) => ({
	practices: many(practices),
}));

export const followUpReasonsRelations = relations(followUpReasons, ({many}) => ({
	practices: many(practices),
	providers: many(providers),
}));

export const pmSystemsRelations = relations(pmSystems, ({many}) => ({
	practices: many(practices),
}));

export const statusesRelations = relations(statuses, ({many}) => ({
	practices: many(practices),
	providers: many(providers),
}));

export const providerPracticeLocationsRelations = relations(providerPracticeLocations, ({one}) => ({
	practiceLocation: one(practiceLocations, {
		fields: [providerPracticeLocations.practiceLocationId],
		references: [practiceLocations.id]
	}),
}));

export const userFavoritesRelations = relations(userFavorites, ({one}) => ({
	practice: one(practices, {
		fields: [userFavorites.practiceId],
		references: [practices.id]
	}),
	provider: one(providers, {
		fields: [userFavorites.providerId],
		references: [providers.id]
	}),
	user: one(users, {
		fields: [userFavorites.userId],
		references: [users.id]
	}),
}));