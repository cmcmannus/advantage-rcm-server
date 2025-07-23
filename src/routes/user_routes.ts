import express from 'express';
import { createUser, deactivateUser, updateUser, getUserById, getUsers } from '../services/users';
import { UserSearchParams } from '../../../shared/dist';

const router = express.Router();

router.post('/create', async (req, res) => {
    const { email, password, first_name, last_name, sales_rep, access_level } = req.body;

    try {
        const user = await createUser({
            email,
            password,
            first_name,
            last_name,
            sales_rep,
            access_level
        });
        if (!user) return res.status(400).json({ message: 'User creation failed' });
        res.status(201).json(user);
        
    } catch (err) {
        res.status(500).json({ message: 'User creation failed' });
    }
});

router.post('/update', async (req, res) => {
    const { id, email, password, first_name, last_name, sales_rep, access_level } = req.body;

    try {
        const user = await updateUser({
            id,
            email,
            password,
            first_name,
            last_name,
            sales_rep,
            access_level
        });
    } catch (err) {
        res.status(500).json({ message: 'User update failed' });
    }
});

router.get('/deactivate/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) return res.status(400).json({ message: 'Invalid user ID' });

    try {
        await deactivateUser(parseInt(id as string));
    } catch (err) {
        res.status(500).json({ message: 'User update failed' });
    }
});

router.get("/search", async (req, res) => {
    try {
        const params: UserSearchParams = {
            email: req.query.email as string,
            first_name: req.query.first_name as string,
            last_name: req.query.last_name as string,
            sales_rep: req.query.sales_rep ? Number(req.query.sales_rep) : undefined,
            access_level: req.query.access_level ? Number(req.query.access_level) : undefined,
            active: req.query.active ? Number(req.query.active) : undefined,
            sort_column: req.query.sort_column as any,
            sort_direction: req.query.sort_direction as any,
        };

        const users = await getUsers(params);
        res.json(users);
    } catch (err) {
        res.status(500).json({
            error: "Unable to retrieve users",
            details: (err as Error).message,
        });
    }
});

router.get('/get/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) return res.status(400).json({ message: 'Invalid user ID' });

    try {
        const user = await getUserById(parseInt(id));
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving user' });
    }
});

export default router;