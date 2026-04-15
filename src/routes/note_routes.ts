import express from 'express';
import {
    createNote,
    deleteNote,
    getNotes,
    updateNote,
    InsertModel,
    SelectModel
} from '../services/notes.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const payload = req.body as InsertModel & { timestamp: string };
    if (!payload) return res.status(400).send();
    const { practiceId, providerId, userId, timestamp, note } = payload;

    if (!userId || !timestamp || !note || (!practiceId && !providerId))
        return res.status(400).json({ message: 'Missing required fields' });

    try {
        const insertedNote = await createNote({
            ...payload,
            timestamp: new Date(payload.timestamp),
        });
        res.status(201).json(insertedNote);
    } catch (err) {
        res.status(500).json({ message: 'Note creation failed' });
    }
});

router.put('/:id', async (req, res) => {
    const { note } = req.body;
    const { id } = req.params;

    if (!id || !note)
        return res.status(400).json({ message: 'Missing required fields' });

    try {
        const updatedNote = await updateNote(Number(id), note);
        res.status(200).json(updatedNote);
    } catch (err) {
        res.status(500).json({ message: 'Note update failed' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id)))
        return res.status(400).json({ message: 'Invalid note ID' });

    try {
        await deleteNote(parseInt(id));
        res.send({ message: 'Note deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Note deletion failed' });
    }
});

router.get('/', async (req, res) => {
    const practiceId = req.query.practiceId
        ? Number(req.query.practiceId)
        : undefined;
    const providerId = req.query.providerId
        ? Number(req.query.providerId)
        : undefined;

    if (!practiceId && !providerId) {
        return res.status(400).json({
            error: 'At least one of practice_id or provider_id must be provided',
        });
    }

    try {
        const notes = await getNotes({ practiceId, providerId });
        res.json(notes);
    } catch (err) {
        res.status(500).json({
            error: 'Unable to retrieve notes',
            details: (err as Error).message,
        });
    }
});

export default router;