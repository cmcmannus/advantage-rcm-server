import { Router } from 'express';
import {
    createPractice,
    updatePractice,
    deletePractice,
    getPracticesForDdl,
    getPracticeLocations,
    search,
    getPractice,
    getPracticeProviders,
    InsertModel,
    SelectModel,
    SearchParams,
    PracticeLocationsSearchParams,
    PracticeProvidersSearchParams
} from '../services/practices.js';
import { exportFunc } from '../services/export.js';

const router = Router();

// Get practices with optional filters
router.get('/', async (req: any, res, next) => {
    try {
        const results = await search(req.query as SearchParams);
        res.send(results);
    } catch (err) {
        next(err);
    }
});

// Create a practice
router.post('/', async (req, res, next) => {
    try {
        const payload: InsertModel = req.body;
        const createdPractice = await createPractice(payload);
        res.status(201).send(createdPractice);
    } catch (err) {
        next(err);
    }
});

// Update a practice
router.put('/:id', async (req, res, next) => {
    try {
        const practice: SelectModel = { ...req.body, id: Number(req.params.id) };
        const updatedPractice = await updatePractice(practice);
        res.send({ updatedPractice });
    } catch (err) {
        next(err);
    }
});

// Delete a practice
router.delete('/:id', async (req, res, next) => {
    try {
        await deletePractice(Number(req.params.id));
        res.send({ message: 'Practice deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

// Get practices for DDL
router.get('/ddl', async (req, res, next) => {
    try {
        const query = req.query.q as string | undefined;
        const ddlPractices = await getPracticesForDdl(query);
        res.send(ddlPractices);
    } catch (err) {
        next(err);
    }
});

router.get('/export', async (req, res, next) => {
    try {
        // Export logic would go here
        const csv = await exportFunc(req.query as unknown as any);
        res.header('Content-Type', 'text/csv');
        res.attachment('practices.csv');
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

// Get practice by ID
router.get('/:id', async (req, res, next) => {
    try {
        const practice = await getPractice(Number(req.params.id));
        if (!practice) {
            return res.status(404).send({ message: 'Practice not found.' });
        }
        res.send(practice);
    } catch (err) {
        next(err);
    }
});

// Get practice locations
router.get('/:id/locations', async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const queryParams = { ...req.query, practiceId: Number(id) } as PracticeLocationsSearchParams;
        const locations = await getPracticeLocations(queryParams);
        if (locations.data.length === 0) {
            return res.status(200).send({ message: 'Practice has no locations.' });
        }
        res.send(locations);
    } catch (err) {
        next(err);
    }
});

// Get practice providers
router.get('/:id/providers', async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const queryParams = { ...req.query, practiceId: Number(id) } as PracticeProvidersSearchParams;
        const providers = await getPracticeProviders(queryParams);
        if (providers.data.length === 0) {
            return res.status(200).send({ message: 'Practice has no providers.' });
        }
        res.send(providers);
    } catch (err) {
        next(err);
    }
});

export default router;