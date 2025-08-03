import express from 'express';
import {
    createNote,
    deleteNote,
    getNotes,
    updateNote,
} from '../services/notes';
import { Note } from '../../../shared/dist';

const router = express.Router();

router.post('/create', async (req, res) => {
    const { practice_id, provider_id, user_id, timestamp, note } = req.body;

    if (!user_id || !timestamp || !note)
        return res.status(400).json({ message: 'Missing required fields' });

    try {
        await createNote({
            practice_id,
            provider_id,
            user_id,
            timestamp,
            note,
        });
        res.status(201).json({ message: 'Note created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Note creation failed' });
    }
});

router.post('/update', async (req, res) => {
    const { note_id, note } = req.body;

    if (!note_id || !note)
        return res.status(400).json({ message: 'Missing required fields' });

    try {
        await updateNote(note_id, note);
        res.status(200).json({ message: 'Note updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Note update failed' });
    }
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id)))
        return res.status(400).json({ message: 'Invalid note ID' });

    try {
        await deleteNote(parseInt(id));
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Note deletion failed' });
    }
});

router.get('/search', async (req, res) => {
    const practice_id = req.query.practice_id
        ? Number(req.query.practice_id)
        : undefined;
    const provider_id = req.query.provider_id
        ? Number(req.query.provider_id)
        : undefined;

    try {
        const notes: Note[] = await getNotes({ practice_id, provider_id });
        res.json(notes);
    } catch (err) {
        res.status(500).json({
            error: 'Unable to retrieve notes',
            details: (err as Error).message,
        });
    }
});

export default router;