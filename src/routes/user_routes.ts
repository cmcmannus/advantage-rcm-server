import express from 'express';
import { createUser, deactivateUser, updateUser, getUserById, getUsers, setResetToken, InsertModel, SearchParams, SelectModel, resetPassword, loginUser, deleteUser } from '../services/users.js';
import { generateResetToken, tokenExpiry } from '../utils/token.js';

const router = express.Router();

// Get All
router.get('/', async (req, res) => {
    try {
        const users = await getUsers(req.query as any);
        res.json({
            data: users,
            paging: {
                totalPages: 1,
                pageNumber: 1,
                pageSize: 100
            }
        });
    } catch (err) {
        res.status(500).json({
            error: "Unable to retrieve users",
            details: (err as Error).message,
        });
    }
});

// Create
router.post('/', async (req, res) => {
    try {
        const user = await createUser(req.body);
        if (!user) return res.status(400).json({ message: 'User creation failed' });
        res.status(201).json(user);
        
    } catch (err) {
        res.status(500).json({ message: 'User creation failed' });
    }
});

// Update
router.put('/', async (req, res) => {
    try {
        const user = await updateUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: 'User update failed' });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) return res.status(400).json({ message: 'Invalid user ID' });

    try {
        const result = await deleteUser(parseInt(id as string));
        if (result) res.status(200).json({ message: 'User deleted successfully' });
        else res.status(404).json({ message: 'User not found' });
    } catch (err) {
        res.status(500).json({ message: 'User deletion failed' });
    }
});

// Search
router.get("/search", async (req, res) => {
    try {
        const params: SearchParams = {
            email: req.query.email as string,
            firstName: req.query.firstName as string,
            lastName: req.query.lastName as string,
            salesRep: req.query.salesRep ? Number(req.query.sales_rep) : undefined,
            accessLevel: req.query.accessLevel ? Number(req.query.access_level) : undefined,
            active: req.query.active ? Number(req.query.active) : undefined,
            sortColumn: req.query.sortColumn as any,
            sortDirection: req.query.sortDirection as any,
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

// Get Sales Reps
router.get('/sales-reps', async (req, res) => {
    try {
        const users = await getUsers({ salesRep: 1, active: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({
            error: "Unable to retrieve sales reps",
            details: (err as Error).message,
        });
    }
});

router.post('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    const user = (req as any).user;
    const dbUser = await loginUser({ email: user.email, password: currentPassword });

    if (!dbUser) return res.status(404).json({ message: 'Current password is incorrect' });

    const token = generateResetToken();
    const expiry = tokenExpiry(0.1); // 0.1 hour expiry

    await setResetToken(dbUser.id as number, token, expiry);

    try {
        const result = await resetPassword({ token, newPassword });
        if (result) res.status(200).json({ message: 'Password reset successful' });
        else res.status(400).json({ message: 'Password reset failed' });
    } catch (err) {
        res.status(400).json({ message: 'Password reset failed' });
    }
});

// Get User
router.get('/:id', async (req, res) => {
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

// Deactivate
router.put('/:id/deactivate', async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) return res.status(400).json({ message: 'Invalid user ID' });

    try {
        await deactivateUser(parseInt(id as string));
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'User deactivation failed' });
    }
});

export default router;