import { Router } from 'express';
import {
    createProvider,
    updateProvider,
    deleteProvider,
    getProviders,
    getProvidersByPracticeId
} from '../services/providers';
import { Provider } from '../../../shared/dist';

const router = Router();

// Create a provider
router.post('/', async (req, res, next) => {
    try {
        const payload: Omit<Provider, 'id'> = req.body;
        await createProvider(payload);
        res.status(201).send({ message: 'Provider created successfully.' });
    } catch (err) {
        next(err);
    }
});

// Update a provider
router.put('/:id', async (req, res, next) => {
    try {
        const provider: Provider = { ...req.body, id: Number(req.params.id) };
        await updateProvider(provider);
        res.send({ message: 'Provider updated successfully.' });
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
        const { provider_id, limit, offset } = req.query;
        const providers = await getProviders({
            provider_id: provider_id ? Number(provider_id) : undefined,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
        res.send(providers);
    } catch (err) {
        next(err);
    }
});

// Get providers by practice ID
router.get('/by-practice/:practice_id', async (req, res, next) => {
    try {
        const providers = await getProvidersByPracticeId(Number(req.params.practice_id));
        res.send(providers);
    } catch (err) {
        next(err);
    }
});

export default router;