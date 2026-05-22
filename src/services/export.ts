import { exportData as providersExport } from './providers.js';
import { exportData as practicesExport } from './practices.js';

function generateCsv(headers: string[], data: Record<string, any>[]): string {
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h];
            return `"${val != null ? val.toString().replace(/"/g, '""') : ''}"`;
        }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}

const providerDefaultMapping = [
    { header: 'NPI', key: 'npi' },
    { header: 'First Name', key: 'firstName' },
    { header: 'Middle Name', key: 'middleName' },
    { header: 'Last Name', key: 'lastName' },
    { header: 'Direct Email', key: 'directEmail' },
    { header: 'Specialization', key: 'specialization' },
    { header: 'Sales Rep', key: 'salesRep' },
    { header: 'Status', key: 'status' },
    { header: 'Action', key: 'action' },
    { header: 'Follow Up Date', key: 'followUpDate' },
    { header: 'Follow Up Reason', key: 'followUpReason' },
];

const practiceDefaultMapping = [
    { header: 'NPI', key: 'npi' },
    { header: 'Name', key: 'name' },
    { header: 'Specialization', key: 'specialization' },
    { header: 'Status', key: 'status' },
    { header: 'Action', key: 'action' },
    { header: 'Follow Up Date', key: 'followUpDate' },
    { header: 'Follow Up Reason', key: 'followUpReason' },
    { header: 'EHR System', key: 'ehrSystem' },
    { header: 'PM System', key: 'pmSystem' },
];

export const exportFunc = async (params: Record<string, any>) => {
    const { entity, columns: rawColumns, sort: rawSort, selectedIds: rawSelectedIds } = params;

    const columns: string[] | undefined = rawColumns
        ? (Array.isArray(rawColumns) ? rawColumns : [rawColumns])
        : undefined;

    const sort = rawSort && typeof rawSort === 'object' && 'field' in rawSort
        ? { field: String(rawSort.field), direction: String(rawSort.direction) }
        : undefined;

    switch (entity) {
        case 'providers': {
            const providerIds = rawSelectedIds
                ? (Array.isArray(rawSelectedIds) ? rawSelectedIds.map(Number) : [Number(rawSelectedIds)])
                : undefined;

            const { data: records, columns: resolvedColumns } = await providersExport({
                sort,
                providerIds,
                columns
            } as any);

            if (columns && columns.length > 0) {
                const csv = generateCsv(resolvedColumns, records);
                return csv;
            }

            const rows = records.map((rec: any) => {
                const row: Record<string, any> = {};
                for (const { header, key } of providerDefaultMapping) {
                    row[header] = rec[key];
                }
                return row;
            });
            const headers = providerDefaultMapping.map(m => m.header);
            const csv = generateCsv(headers, rows);
            return csv;
        }
        case 'practices': {
            const practiceIds = rawSelectedIds
                ? (Array.isArray(rawSelectedIds) ? rawSelectedIds : [rawSelectedIds])
                : undefined;

            const { data: records, columns: resolvedColumns } = await practicesExport({
                sort,
                practiceIds,
                columns
            } as any);

            if (columns && columns.length > 0) {
                const csv = generateCsv(resolvedColumns, records);
                return csv;
            }

            const rows = records.map((rec: any) => {
                const row: Record<string, any> = {};
                for (const { header, key } of practiceDefaultMapping) {
                    row[header] = rec[key];
                }
                return row;
            });
            const headers = practiceDefaultMapping.map(m => m.header);
            const csv = generateCsv(headers, rows);
            return csv;
        }
        default:
            throw new Error('Unknown entity type for export');
    }
};
