import { search as providersSearch, SearchParams } from './providers.js';
import { search as practicesSearch } from './practices.js';

export interface ExportParams {
    entity: 'providers' | 'practices';
    filters: { [key: string]: string };
    sort: { field: string; direction: 'asc' | 'desc' };
    selectedIds?: string[];
}

export const exportFunc = async ({
    entity,
    filters = {},
    sort = { field: 'lastName', direction: 'asc' },
    selectedIds
}: ExportParams) => {
    switch (entity) {
        case 'providers':
            // Implement provider export logic here
            console.log('Exporting providers with filters:', filters, 'sort:', sort, 'selectedIds:', selectedIds);
            // extract filters into format seach function expects
            const searchParams: any = {
                ...Object.keys(filters).map(key => ({ [key]: filters[key] })),
                sortField: sort.field,
                sortDir: sort.direction,
                providerIds: Array.isArray(selectedIds) ? selectedIds : [selectedIds],
                pageSize: -1
            }
            const records = await providersSearch(searchParams);

            const output = [
                ['NPI', 'First Name', 'Middle Name', 'Last Name', 'Direct Email', 'Specialization', 'Sales Rep', 'Status', 'Action', 'Follow Up Date', 'Follow Up Reason'],
                ...records.data.map(rec => ([
                    rec.npi,
                    rec.firstName,
                    rec.middleName,
                    rec.lastName,
                    rec.directEmail,
                    rec.specialization,
                    rec.salesRep,
                    rec.status,
                    rec.action,
                    rec.followUpDate,
                    rec.followUpReason
                ]))
            ];

            const csv = output.map(row => row.map(item => `"${item ? item.toString().replace(/"/g, '""') : ''}"`).join(',')).join('\n');

            return csv;
        case 'practices':
            // Implement practice export logic here
            console.log('Exporting practices with filters:', filters, 'sort:', sort, 'selectedIds:', selectedIds);
            // extract filters into format seach function expects
            const practiceSearchParams: any = {
                ...Object.keys(filters).map(key => ({ [key]: filters[key] })),
                sortField: sort.field,
                sortDir: sort.direction,
                practiceIds: Array.isArray(selectedIds) ? selectedIds : [selectedIds],
                pageSize: -1
            }
            const practiceRecords = await practicesSearch(practiceSearchParams);

            const practiceOutput = [
                ['NPI', 'Name', 'Specialization', 'Status', 'Action', 'Follow Up Date', 'Follow Up Reason', 'EHR System', 'PM System'],
                ...practiceRecords.data.map(rec => ([
                    rec.npi,
                    rec.name,
                    rec.specialization,
                    rec.status,
                    rec.action,
                    rec.followUpDate,
                    rec.followUpReason,
                    rec.ehrSystem,
                    rec.pmSystem
                ]))
            ];

            const practiceCsv = practiceOutput.map(row => row.map(item => `"${item ? item.toString().replace(/"/g, '""') : ''}"`).join(',')).join('\n');

            return practiceCsv;
        default:
            throw new Error('Unknown entity type for export');
    }
}