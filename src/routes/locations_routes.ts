import { Router } from 'express';
import {
    createLocation,
    updateLocation,
    deleteLocation,
    getLocations,
    InsertModel,
    SelectModel,
} from '../services/locations.js';

const router = Router();

// Create a location
router.post('/', async (req, res, next) => {
    try {
        const payload: InsertModel = req.body;
        const createdLocation = await createLocation(payload);
        res.status(201).send(createdLocation);
    } catch (err) {
        next(err);
    }
});

// Update a location
router.put('/:id', async (req, res, next) => {
    try {
        const location: SelectModel = { ...req.body, id: Number(req.params.id) };
        const updatedLocation = await updateLocation(location);
        res.send(updatedLocation);
    } catch (err) {
        next(err);
    }
});

// Delete a location
router.delete('/:id', async (req, res, next) => {
    try {
        await deleteLocation(Number(req.params.id));
        res.send({ message: 'Location deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

// Get locations with optional filters
router.get('/', async (req: any, res, next) => {
    try {
        const { address, city, state, page, sort, order } = req.query;
        const results = await getLocations({ address, city, state, page, sort, order });
        res.send({ locations: results });
    } catch (err) {
        next(err);
    }
});

export default router;