import { Router } from 'express';
import { searchPracticeProvider } from '../services/search.js';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const {
            searchText,
            statusId,
            actionId,
            followUpReasonId,
            salesRepId,
            limit,
            offset,
        } = req.query;

        const results = await searchPracticeProvider({
            searchText: typeof searchText === 'string' ? searchText : undefined,
            statusId: statusId ? Number(statusId) : undefined,
            actionId: actionId ? Number(actionId) : undefined,
            followUpReasonId: followUpReasonId ? Number(followUpReasonId) : undefined,
            salesRepId: salesRepId ? Number(salesRepId) : undefined,
            limit: limit ? Number(limit) : 25,
            offset: offset ? Number(offset) : 0,
        });

        res.send(results);
    } catch (err) {
        next(err);
    }
});

router.get('/typeahead', async (req, res, next) => {
    try {
        const { query } = req.query;

        if (typeof query !== 'string' || query.trim().length < 3) {
            return res.status(400).json({ error: 'Query parameter must be at least 3 characters long.' });
        }

        const results = await searchPracticeProvider({
            searchText: query,
            limit: 5,
        });

        res.json(results);
    } catch (err) {
        next(err);
    }
});

export default router;