// routes/create_crud_routes.ts
import express from "express";

export function createCrudRoutes<T>(
    service: {
        create: (arg: any) => Promise<T>;
        update: (id: number, arg: any) => Promise<T>;
        delete: (id: number) => Promise<void>;
        getAll: () => Promise<T[]>;
    },
    resourceName: string = "resource"
) {
    const router = express.Router();

    router.get("/", async (_, res) => {
        try {
            const items = await service.getAll();
            res.json(items);
        } catch (err) {
            res.status(500).json({ error: `Failed to fetch ${resourceName}s`, details: (err as Error).message });
        }
    });

    router.post("/", async (req, res) => {
        try {
            const item = await service.create(req.body[resourceName]);
            res.status(201).json(item);
        } catch (err) {
            res.status(500).json({ error: `Failed to create ${resourceName}`, details: (err as Error).message });
        }
    });

    router.put("/:id", async (req, res) => {
        try {
            const item = await service.update(Number(req.params.id), req.body[resourceName]);
            res.json(item);
        } catch (err) {
            res.status(500).json({ error: `Failed to update ${resourceName}`, details: (err as Error).message });
        }
    });

    router.delete("/:id", async (req, res) => {
        try {
            await service.delete(Number(req.params.id));
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: `Failed to delete ${resourceName}`, details: (err as Error).message });
        }
    });

    return router;
}