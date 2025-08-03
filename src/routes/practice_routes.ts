import { Router } from 'express';
import {
    createPractice,
    updatePractice,
    deletePractice,
    getPractices
} from '../services/practices';
import { Practice } from '../../../shared/dist';

const router = Router();

// Create a practice
router.post('/', async (req, res, next) => {
    try {
        const payload: Omit<Practice, 'id'> = req.body;
        await createPractice(payload);
        res.status(201).send({ message: 'Practice created successfully.' });
    } catch (err) {
        next(err);
    }
});

// Update a practice
router.put('/:id', async (req, res, next) => {
    try {
        const practice: Practice = { ...req.body, id: Number(req.params.id) };
        await updatePractice(practice);
        res.send({ message: 'Practice updated successfully.' });
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

// Get practices with optional filters
router.get('/', async (req, res, next) => {
    try {
        const { practice_id, limit, offset } = req.query;
        const practices = await getPractices({
            practice_id: practice_id ? Number(practice_id) : undefined,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
        res.send(practices);
    } catch (err) {
        next(err);
    }
});

export default router;