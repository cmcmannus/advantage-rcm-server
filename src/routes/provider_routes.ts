import { Router } from 'express';
import {
    createProvider,
    updateProvider,
    deleteProvider,
    getProviderPractices,
    search,
    getProvider,
    InsertModel,
    SelectModel,
    SearchParams,
    ProviderPracticesSearchParams
} from '../services/providers.js';
import { exportFunc } from '../services/export.js';
import { setProviderPrimaryLocation } from '../services/practiceLocations.js';
import { addToUserFavorites, removeFromUserFavorites } from 'services/favorites.js'; 
const router = Router();

// Create a provider
router.post('/', async (req, res, next) => {
    try {
        const payload: InsertModel = req.body;
        const createdProvider = await createProvider(payload);
        res.status(201).send(createdProvider);
    } catch (err) {
        next(err);
    }
});

// Update a provider
router.put('/:id', async (req, res, next) => {
    try {
        const provider: SelectModel = { ...req.body, id: Number(req.params.id) };
        const updatedProvider = await updateProvider(provider);
        res.send(updatedProvider);
    } catch (err) {
        next(err);
    }
});

router.get('/export', async (req, res, next) => {
    try {
        // Export logic would go here
        const csv = await exportFunc({
            ...req.query as unknown as any,
            selectedIds: req.query['selectedIds[]'] as string[]
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('providers.csv');
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

// Delete a provider
router.delete('/:id', async (req, res, next) => {
    try {
        await deleteProvider(Number(req.params.id));
        res.send({ message: 'Provider deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

// Get providers with optional filters
router.get('/', async (req, res, next) => {
    try {
        let params = req.query as unknown as SearchParams;
        if (params.favoritesOnly === 'true') {
            params.userId = (req as any).user.id;
        }
        const results = await search(params);
        res.send(results);
    } catch (err) {
        next(err);
    }
});

// Get practices by provider ID
router.get('/:id/practices', async (req, res, next) => {
    try {
        const { id } = req.params;
        const queryParams = { ...req.query, providerId: Number(id) } as ProviderPracticesSearchParams;
        const practices = await getProviderPractices(queryParams);
        if (practices.data.length === 0) {
            return res.status(200).send({ error: 'Provider is not associated with any practices.' });
        }
        res.send(practices);
    } catch (err) {
        next(err);
    }
});

// Get provider by ID
router.get('/:id', async (req, res, next) => {
    try {
        const provider = await getProvider(Number(req.params.id), (req as any).user.id);
        if (!provider) {
            return res.status(404).send({ error: 'Provider not found.' });
        }
        res.send(provider);
    } catch (err) {
        next(err);
    }
});

// Favorites routes

// Set favorite
router.post('/:id/favorite', async (req, res, next) => {
    try {
        const providerId = Number(req.params.id);
        const userId = (req as any).user.id;
        
        await addToUserFavorites(userId, undefined, providerId);

        res.send({ message: 'Provider marked as favorite.' });
    } catch (err) {
        next(err);
    }
});

// Delete favorite
router.delete('/:id/favorite', async (req, res, next) => {
    try {
        const providerId = Number(req.params.id);
        const userId = (req as any).user.id;
        
        await removeFromUserFavorites(userId, undefined, providerId);

        res.send({ message: 'Provider removed from favorites.' });
    } catch (err) {
        next(err);
    }
});

// Set provider primary practice location
router.post('/:id/primary-location', async (req, res, next) => {
    try {
        const providerId = Number(req.params.id);
        const { practice_location_id, set } = req.body;
        if (!practice_location_id) {
            return res.status(400).send({ error: 'practice_location_id is required.' });
        }
        const response = await setProviderPrimaryLocation(providerId, practice_location_id, set);
        res.send({ message: 'Provider primary location updated successfully.' });
    } catch (err) {
        next(err);
    }
});

export default router;