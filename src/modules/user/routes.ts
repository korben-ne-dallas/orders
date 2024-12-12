import { db } from '../../db';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await db.user.findOneOrFail(+id);
    res.json(user);
});

router.post('/', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const savedUser = db.user.create({ email, password });

    await db.em.flush();

    res.send(savedUser);
});

export default router;