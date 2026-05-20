import { jest, describe, beforeEach, it, expect } from '@jest/globals';

const mockProvidersExport = jest.fn<(...args: any[]) => any>();
const mockPracticesExport = jest.fn<(...args: any[]) => any>();

jest.unstable_mockModule('./providers.js', () => ({
    exportData: mockProvidersExport,
}));

jest.unstable_mockModule('./practices.js', () => ({
    exportData: mockPracticesExport,
}));

const { exportFunc } = await import('./export.js');

describe('exportFunc', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('providers', () => {
        it('generates CSV with default columns', async () => {
            mockProvidersExport.mockResolvedValue({
                data: [
                    { npi: '1234567890', firstName: 'John', middleName: 'M', lastName: 'Doe', directEmail: 'john.doe@example.com', specialization: 'Cardiology', salesRep: 'Jane Smith', status: 'Active', action: 'none', followUpDate: null, followUpReason: null },
                    { npi: '9876543210', firstName: 'Jane', middleName: null, lastName: 'Smith', directEmail: null, specialization: 'Neurology', salesRep: 'Bob Jones', status: 'Pending', action: 'Follow Up', followUpDate: new Date('2025-06-01'), followUpReason: 'Pending documents' },
                ],
                columns: ['npi', 'firstName', 'middleName', 'lastName', 'directEmail', 'specialization', 'salesRep', 'status', 'action', 'followUpDate', 'followUpReason'],
            });

            const csv = await exportFunc({ entity: 'providers' });

            const lines = csv.split('\n');
            expect(lines[0]).toBe('NPI,First Name,Middle Name,Last Name,Direct Email,Specialization,Sales Rep,Status,Action,Follow Up Date,Follow Up Reason');
            expect(lines[1]).toBe('"1234567890","John","M","Doe","john.doe@example.com","Cardiology","Jane Smith","Active","none","",""');
            expect(lines[2]).toContain('"9876543210","Jane","","Smith"');
            expect(lines[2]).toContain('"Pending documents"');
            expect(lines[2]).toContain('"Follow Up"');
        });

        it('passes columns to exportData and uses resolved columns for headers', async () => {
            mockProvidersExport.mockResolvedValue({
                data: [{ npi: '111', firstName: 'A', lastName: 'B', specialization: 'Test' }],
                columns: ['npi', 'firstName', 'lastName', 'specialization'],
            });

            const csv = await exportFunc({ entity: 'providers', columns: ['npi', 'firstName', 'lastName', 'specialization'] });

            expect(mockProvidersExport).toHaveBeenCalledWith(
                expect.objectContaining({ columns: ['npi', 'firstName', 'lastName', 'specialization'] })
            );
            const lines = csv.split('\n');
            expect(lines[0]).toBe('npi,firstName,lastName,specialization');
            expect(lines[1]).toBe('"111","A","B","Test"');
        });

        it('passes selectedIds as providerIds', async () => {
            mockProvidersExport.mockResolvedValue({ data: [], columns: ['npi'] });

            await exportFunc({ entity: 'providers', 'selectedIds[]': ['1', '2'] });

            expect(mockProvidersExport).toHaveBeenCalledWith(
                expect.objectContaining({ providerIds: [1, 2] })
            );
        });

        it('handles column expansion from locations trigger', async () => {
            mockProvidersExport.mockResolvedValue({
                data: [{ npi: '111', firstName: 'A', lastName: 'B', address1: '123 Main', city: 'Portland', state: 'OR', zip: '97201', practiceName: 'Health Center' }],
                columns: ['npi', 'firstName', 'lastName', 'address1', 'address2', 'city', 'state', 'zip', 'practiceName'],
            });

            const csv = await exportFunc({ entity: 'providers', columns: ['npi', 'firstName', 'lastName', 'locations'] });

            expect(mockProvidersExport).toHaveBeenCalledWith(
                expect.objectContaining({ columns: ['npi', 'firstName', 'lastName', 'locations'] })
            );
            expect(csv.split('\n')[0]).toBe('npi,firstName,lastName,address1,address2,city,state,zip,practiceName');
        });
    });

    describe('practices', () => {
        it('generates CSV with default columns', async () => {
            mockPracticesExport.mockResolvedValue({
                data: [
                    { npi: '555', name: 'Test Clinic', specialization: 'General', status: 'Active', action: null, followUpDate: null, followUpReason: null, ehrSystem: 'Epic', pmSystem: null },
                ],
                columns: ['npi', 'name', 'specialization', 'status', 'action', 'followUpDate', 'followUpReason', 'ehrSystem', 'pmSystem'],
            });

            const csv = await exportFunc({ entity: 'practices' });

            const lines = csv.split('\n');
            expect(lines[0]).toBe('NPI,Name,Specialization,Status,Action,Follow Up Date,Follow Up Reason,EHR System,PM System');
            expect(lines[1]).toContain('"555"');
            expect(lines[1]).toContain('"Epic"');
        });

        it('uses resolved columns as headers when columns specified', async () => {
            mockPracticesExport.mockResolvedValue({
                data: [{ name: 'Clinic A' }],
                columns: ['name'],
            });

            const csv = await exportFunc({ entity: 'practices', columns: ['name'] });

            expect(csv.split('\n')[0]).toBe('name');
        });

        it('passes selectedIds as practiceIds', async () => {
            mockPracticesExport.mockResolvedValue({ data: [], columns: ['npi'] });

            await exportFunc({ entity: 'practices', 'selectedIds[]': ['10', '20'] });

            expect(mockPracticesExport).toHaveBeenCalledWith(
                expect.objectContaining({ practiceIds: ['10', '20'] })
            );
        });
    });

    describe('error handling', () => {
        it('throws for unknown entity', async () => {
            await expect(exportFunc({ entity: 'unknown' })).rejects.toThrow('Unknown entity type for export');
        });

        it('throws when entity is missing', async () => {
            await expect(exportFunc({})).rejects.toThrow('Unknown entity type for export');
        });
    });

    describe('CSV formatting', () => {
        it('escapes double quotes in values', async () => {
            mockProvidersExport.mockResolvedValue({
                data: [{ npi: '1', firstName: 'Jo"hn', lastName: 'Do"e' }],
                columns: ['npi', 'firstName', 'lastName'],
            });

            const csv = await exportFunc({ entity: 'providers', columns: ['npi', 'firstName', 'lastName'] });

            expect(csv).toContain('"Jo""hn"');
            expect(csv).toContain('"Do""e"');
        });
    });
});
