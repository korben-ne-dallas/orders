import { db } from '../../db';
import { Router, Request, Response } from 'express';
import { Order } from "./order.entity";
import fileUpload from "express-fileupload";
import { User } from "../user/user.entity";

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await db.order.findOne(+id, { populate: ['user'] });

    res.send(order);
});

router.post('/', async (req: Request, res: Response) => {
    const { deliveryAddress, orderDate, note, status, userId } = req.body;

    if (!deliveryAddress || !orderDate || !status) {
        res.status(400).json({ error: '"deliveryAddress", "orderDate" and "status" are required!' });
        return;
    }

    const user = userId && await db.user.findOne(userId);

    const order = db.order.create({
        user,
        deliveryAddress,
        orderDate,
        status,
        note
    });

    await db.em.flush();

    res.status(201).send(order);
});

router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const { deliveryAddress, orderDate, status, note, userId } = req.body;

    const order = await db.order.findOne(+id);

    if (order) {
        order.deliveryAddress = deliveryAddress || order.deliveryAddress;
        order.orderDate = orderDate || order.orderDate;
        order.status = status || order.status;
        order.note = note || order.note;

        if (userId) {
            const user = await db.user.findOne(+userId);

            if (!user) {
                res.status(400).json({ error: 'No user with such id!' });
                return;
            }

            order.user = user;
        }

        await db.em.flush();

        res.send(order);
        return;
    }

    res.status(400).json({ error: 'No order with such id!' });
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await db.order.findOne(+id);

    if (order) {
        await db.em.removeAndFlush(order);

        res.send(order);
        return;
    }

    res.status(400).json({ error: 'No order with such id!' });
});

router.post('/_list', async (req: Request, res: Response) => {
    const { page, size, userId, status } = req.body;

    if (!page || !size) {
        res.status(400).json({ error: 'Both "page" and "size" parameters are required!' });
        return;
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(size, 10);

    if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber < 1 || pageSize < 1) {
        res.status(400).json({ error: '"page" and "size" must be positive numbers!' });
        return;
    }

    const filters: Record<string, string> = {};

    if (userId !== undefined) {
        filters.user = userId;
    }

    if (status !== undefined) {
        filters.status = status;
    }

    const offset = (pageNumber - 1) * pageSize;

    const [orders, total] = await db.em.findAndCount(Order, filters, {
        limit: pageSize,
        offset,
        orderBy: { id: 'ASC' },
        fields: ['orderDate', 'status']
    });

    const totalPages = Math.ceil(total / pageSize);

    res.json({
        list: orders,
        totalPages
    });
});

router.post('/upload', async (req: Request, res: Response) => {
    if (!req.files || !req.files.file) {
        res.status(400).json({ error: 'No file uploaded!' });
        return;
    }

    const uploadedFile = req.files.file as fileUpload.UploadedFile;

    if (uploadedFile.mimetype !== 'application/json') {
        res.status(400).json({ error: 'Only JSON files are allowed!' });
        return;
    }

    const fileContent = uploadedFile.data.toString('utf-8');

    try {
        const ordersData = JSON.parse(fileContent);

        const successfulImports = await db.em.transactional(async (em) => {
            let count = 0;

            for (const orderData of ordersData) {
                if (!orderData.deliveryAddress || !orderData.orderDate || !orderData.status) {
                    throw new Error(`Invalid order data: ${JSON.stringify(orderData)}!`);
                }

                const order = new Order();

                if (orderData.userId) {
                    const user = await em.findOne(User, orderData.userId);
                    user && (order.user = user);
                }

                order.deliveryAddress = orderData.deliveryAddress;
                order.orderDate = new Date(orderData.orderDate);
                order.status = orderData.status;
                order.note = orderData.note;

                em.persist(order);
                count++;
            }

            await em.flush();
            return count;
        });

        res.json({
            importedRecords: successfulImports
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Error processing the uploaded file!' });
    }
});

export default router;