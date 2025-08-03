import { Router } from 'express';
import { searchPracticeProvider } from '../services/search';

const router = Router();

router.get('/', async (req, res, next) => {
    try {
        const {
            search_text,
            status_id,
            action_id,
            follow_up_reason_id,
            sales_rep_id,
            limit,
            offset,
        } = req.query;

        const results = await searchPracticeProvider({
            search_text: typeof search_text === 'string' ? search_text : undefined,
            status_id: status_id ? Number(status_id) : undefined,
            action_id: action_id ? Number(action_id) : undefined,
            follow_up_reason_id: follow_up_reason_id ? Number(follow_up_reason_id) : undefined,
            sales_rep_id: sales_rep_id ? Number(sales_rep_id) : undefined,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });

        res.send(results);
    } catch (err) {
        next(err);
    }
});

export default router;