import { Router } from 'express';
import {
    createPractice,
    updatePractice,
    deletePractice,
    getPracticesForDdl,
    search,
    getPractice,
    getPracticeProviders,
    InsertModel,
    SelectModel,
    SearchParams,
    PracticeProvidersSearchParams,
    getProvidersAvailableForPractice
} from '../services/practices.js';
import {
    createPracticeLocation,
    CreatePracticeLocationParams,
    deletePracticeLocation,
    getPracticeLocation,
    getPracticeLocations,
    PracticeLocationsSearchParams,
    updatePracticeLocation,
    updateProviderPracticeLocations
} from '../services/practiceLocations.js';
import { exportFunc } from '../services/export.js';
import { addToUserFavorites, removeFromUserFavorites } from 'services/favorites.js';

const router = Router();

// Get practices with optional filters
router.get('/', async (req: any, res, next) => {
    try {
        let params = req.query as SearchParams;
        if (params.favoritesOnly === 'true') {
            params.userId = (req as any).user.id;
        }
        const results = await search(params);
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
        res.send(updatedPractice);
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
        const entity = req.query.entity as 'practices' | 'providers';
        const selectedIds: string[] = req.query['selectedIds[]'] as string[] || [];
        const sortDir = req.query['sort[direction]'] || 'asc';
        const sortField = req.query['sort[field]'] || (entity === 'providers' ? 'lastName' : 'name');

        const csv = await exportFunc({
            entity,
            selectedIds,
            sort: {
                field: sortField as string,
                direction: sortDir as 'asc' | 'desc'
            },
            filters: {}
        });
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
        const practice = await getPractice(Number(req.params.id), (req as any).user.id);
        if (!practice) {
            return res.status(404).send({ message: 'Practice not found.' });
        }
        res.send(practice);
    } catch (err) {
        next(err);
    }
});

// Favorites routes

// Set favorite
router.post('/:id/favorite', async (req, res, next) => {
    try {
        const practiceId = Number(req.params.id);
        const userId = (req as any).user.id;
        
        await addToUserFavorites(userId, practiceId);

        res.send({ message: 'Provider marked as favorite.' });
    } catch (err) {
        next(err);
    }
});

// Delete favorite
router.delete('/:id/favorite', async (req, res, next) => {
    try {
        const practiceId = Number(req.params.id);
        const userId = (req as any).user.id;
        
        await removeFromUserFavorites(userId, practiceId);

        res.send({ message: 'Provider removed from favorites.' });
    } catch (err) {
        next(err);
    }
});

// Create practice location
router.post('/:id/locations', async (req: any, res, next) => {
    try {
        const queryParams = { ...req.body, practiceId: Number(req.params.id) } as CreatePracticeLocationParams;
        const location = await createPracticeLocation(queryParams);
        return res.send(location);
    } catch (err) {
        next(err);
    }
});

// Update practice location
router.put('/locations/:id', async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const params = { ...req.body, practiceLocationId: Number(id) };
        const location = await updatePracticeLocation(params);
        if (!location) {
            return res.status(200).send({ message: 'Practice has no locations.' });
        }
        res.send(location);
    } catch (err) {
        next(err);
    }
});

// Delete practice location
router.delete('/locations/:id', async (req: any, res, next) => {
    try {
        const { id } = req.params;
        await deletePracticeLocation(Number(id));
        res.send({ message: 'Practice location deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

// Get practice location
router.get('/locations/:id', async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const location = await getPracticeLocation(Number(id));
        if (!location) {
            return res.status(404).send({ message: 'Practice location not found.' });
        }
        res.send(location);
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

// Update practice provider location association(s)
router.post('/:practiceId/providers/:providerId', async (req: any, res, next) => {
    try {
        const { practiceId, providerId } = req.params;
        const locationIds: number[] = req.body.locationIds;
        
        const result = await updateProviderPracticeLocations(Number(providerId), Number(practiceId), locationIds);

        res.status(201).send(result);
    } catch (err) {
        next(err);
    }
});

//Get available providers
router.get('/:id/available-providers', async (req: any, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.query;
        const availableProviders = await getProvidersAvailableForPractice(Number(id), name);
        res.send(availableProviders);
    } catch (err) {
        next(err);
    }
});

export default router;