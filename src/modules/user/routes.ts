import { db } from '../../db';
import { Router, Request, Response } from 'express';
import { knexQueryBuilder } from "../../queryBuilder";

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    const users = await db.user.findAll();
    res.json(users);
});

router.post('/', async (req: Request, res: Response) => {
    const { email, name } = req.body;

    try {
        const savedUser = db.user.create({ email, name });

        await db.em.flush();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(400).json({ message: 'Email already in use' });
        return;
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
            res.status(400).json({ message: 'No user with such id' });
            return;
        }

        await db.em.flush();
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: 'Email already in use' });
        return;
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await db.user.findOne(+id);

    if (user) {
        await db.em.removeAndFlush(user);
    }

    res.json(user);
});

router.get('/top', async (req: Request, res: Response) => {
    const { n } = req.query;

    if (n) {
        const user = await knexQueryBuilder('users')
            .leftJoin('orders', 'users.id', 'orders.user_id')
            .select('users.id', 'users.name', knexQueryBuilder.raw('COUNT(orders.id) as count'))
            .groupBy('users.id')
            .orderBy('count', 'desc')
            .limit(+n);

        res.json(user);
        return;
    }

    res.status(400).json({ message: 'Request should contain n={n} query parameter' });
});

export default router;