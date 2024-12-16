import { db } from '../../db';
import { Router, Request, Response } from 'express';
import { getKnexQueryBuilder } from "../../queryBuilder";
import { publishMessage } from "../../pubsub/publishers/publisher";

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const users = await db.user.findAll();
    res.json(users);
});

router.post('/', async (req: Request, res: Response) => {
    const { email, name } = req.body;

    if (!email || !name) {
        res.status(400).json({ error: '"email" and "name" are required fields!' });
        return;
    }

    try {
        const savedUser = db.user.create({ email, name });

        await db.em.flush();
        await publishMessage({ userId: savedUser.id });

        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ error: 'Email already in use!' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, name } = req.body;

    try {
        const user = await db.user.findOne(+id);

        if (user) {
            user.email = email || user.email;
            user.name = name || user.name;
        } else {
            res.status(400).json({ error: 'No user with such id!' });
            return;
        }

        await db.em.flush();
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Email already in use!' });
        return;
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await db.user.findOne(+id);

    if (user) {
        await db.em.removeAndFlush(user);
        res.json(user);
        return;
    }

    res.status(400).json({ error: 'No user with such id!' });
});

router.get('/top', async (req: Request, res: Response) => {
    const { n } = req.query;

    if (n) {
        const user = await getKnexQueryBuilder()
            .from('users')
            .leftJoin('orders', 'users.id', 'orders.user_id')
            .select('users.id', 'users.name', getKnexQueryBuilder().raw('COUNT(orders.id) as count'))
            .groupBy('users.id')
            .orderBy('count', 'desc')
            .limit(+n);

        res.json(user);
        return;
    }

    res.status(400).json({ error: 'Request should contain n={n} query parameter!' });
});

export default router;