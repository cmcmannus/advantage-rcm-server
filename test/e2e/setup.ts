import { jest } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.test' });

type MockRecord = Record<string, any>;

const mysql2Mock = () => ({
  default: {
    createPool: () => ({
      execute: jest.fn().mockResolvedValue([[], []]),
      query: jest.fn().mockResolvedValue([[], []]),
      end: jest.fn(),
    }),
  },
  createPool: () => ({
    execute: jest.fn().mockResolvedValue([[], []]),
    query: jest.fn().mockResolvedValue([[], []]),
    end: jest.fn(),
  }),
});

function fn() { return jest.fn<any>(); }

const crud = () => ({ getAll: fn(), create: fn(), update: fn(), delete: fn() });

export const defaultMocks: Record<string, () => MockRecord> = {
  'mysql2/promise': mysql2Mock,
  '../../src/services/users': () => ({
    getUsers: fn(), loginUser: fn(), resetPassword: fn(), setResetToken: fn(),
    validateResetToken: fn(), createUser: fn(), deactivateUser: fn(),
    updateUser: fn(), getUserById: fn(), deleteUser: fn(), verifyResetToken: fn(),
  }),
  '../../src/services/email': () => ({
    Emailer: jest.fn().mockImplementation(() => ({
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    })),
  }),
  '../../src/services/providers': () => ({
    createProvider: fn(), updateProvider: fn(), deleteProvider: fn(),
    getProviderPractices: fn(), getProviderFilterOptions: fn(),
    search: fn(), getProvider: fn(), exportData: fn(), providerColumnMap: {},
  }),
  '../../src/services/practices': () => ({
    createPractice: fn(), updatePractice: fn(), deletePractice: fn(),
    getPracticesForDdl: fn(), getPracticeFilterOptions: fn(),
    search: fn(), getPractice: fn(), getPracticeProviders: fn(),
    getProvidersAvailableForPractice: fn(), exportData: fn(), practiceColumnMap: {},
  }),
  '../../src/services/practiceLocations': () => ({
    getPracticeLocation: fn(), getPracticeLocations: fn(),
    createPracticeLocation: fn(), updatePracticeLocation: fn(),
    deletePracticeLocation: fn(), setProviderPrimaryLocation: fn(),
    updateProviderPracticeLocations: fn(),
  }),
  '../../src/services/notes': () => ({
    createNote: fn(), updateNote: fn(), deleteNote: fn(), getNotes: fn(),
  }),
  '../../src/services/search': () => ({
    searchPracticeProvider: fn(),
  }),
  '../../src/services/favorites': () => ({
    addToUserFavorites: fn(), removeFromUserFavorites: fn(),
  }),
  '../../src/services/export': () => ({
    exportFunc: fn(),
  }),
  '../../src/services/locations': () => ({
    createLocation: fn(), updateLocation: fn(), deleteLocation: fn(), getLocations: fn(),
  }),
  '../../src/services/actions': () => ({ actionService: crud() }),
  '../../src/services/statuses': () => ({ statusService: crud() }),
  '../../src/services/clearing_houses': () => ({ clearingHouseService: crud() }),
  '../../src/services/ehr_systems': () => ({ ehrSystemService: crud() }),
  '../../src/services/pm_systems': () => ({ pmSystemService: crud() }),
  '../../src/services/follow_up_reasons': () => ({ followUpReasonService: crud() }),
};

export function mockAllServices(overrides: Record<string, MockRecord> = {}) {
  for (const [moduleName, factory] of Object.entries(defaultMocks)) {
    if (overrides[moduleName]) {
      jest.unstable_mockModule(moduleName, () => overrides[moduleName]);
    } else {
      jest.unstable_mockModule(moduleName, factory);
    }
  }
}
