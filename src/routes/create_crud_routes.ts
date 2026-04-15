// routes/create_crud_routes.ts
import express from "express";

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

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
            if ((req as any).user.accessLevel !== 1) return res.status(401);
            const item = await service.create(req.body.name);
            res.status(200).json(item);
        } catch (err) {
            res.status(500).json({ error: `Failed to create ${resourceName}`, details: (err as Error).message });
        }
    });

    router.put("/:id", async (req, res) => {
        try {
            if ((req as any).user.accessLevel !== 1) return res.status(401);
            const item = await service.update(Number(req.params.id), req.body.name);
            res.json(item);
        } catch (err) {
            res.status(500).json({ error: `Failed to update ${resourceName}`, details: (err as Error).message });
        }
    });

    router.delete("/:id", async (req, res) => {
        try {
            if ((req as any).user.accessLevel !== 1) return res.status(401);
            await service.delete(Number(req.params.id));
            res.send({ message: `${capitalizeFirstLetter(resourceName)} deleted successfully` });
        } catch (err) {
            res.status(500).json({ error: `Failed to delete ${resourceName}`, details: (err as Error).message });
        }
    });

    return router;
}