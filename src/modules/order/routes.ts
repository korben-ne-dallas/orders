import { db } from '../../db';
import { Router, Request, Response } from 'express';
import { Order } from "./order.entity";
import fileUpload from "express-fileupload";

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ error: 'Order id is required!' });
    }

    const order = await db.order.findOne(+id, {populate: ['user']});

    res.send(order);
});

router.post('/', async (req: Request, res: Response) => {
    const { deliveryAddress, orderDate, note, status, userId } = req.body;

    if (!deliveryAddress || !orderDate || !status) {
        res.status(400).json({ error: '"deliveryAddress", "orderDate" and "status" are required!' });
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

    res.send(order);
});

router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ error: 'Order id is required!' });
    }

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
                order.user = undefined;
            } else {
                order.user = user;
            }
        }
    }

    await db.em.flush();

    res.send(order);
});

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ error: 'Order id is required!' });
    }

    const order = await db.order.findOne(+id);

    if (order) {
        await db.em.removeAndFlush(order);
    }

    res.send(order);
});

router.post('/_list', async (req: Request, res: Response) => {
    const { page, size, userId, status } = req.body;

    if (!page || !size) {
        res.status(400).json({ error: 'Both "page" and "size" parameters are required!' });
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(size, 10);

    if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber < 1 || pageSize < 1) {
        res.status(400).json({ error: '"page" and "size" must be positive numbers' });
        return;
    }

    try {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching orders' });
    }
});

router.post('/upload', async (req: Request, res: Response) => {
    if (!req.files || !req.files.file) {
        res.status(400).send('No file uploaded');
        return;
    }

    const uploadedFile = req.files.file as fileUpload.UploadedFile;

    if (uploadedFile.mimetype !== 'application/json') {
        res.status(400).send('Only JSON files are allowed');
        return;
    }

    const fileContent = uploadedFile.data.toString('utf-8');

    try {
        const ordersData = JSON.parse(fileContent);

        await db.em.transactional(async (em) => {
            let successfulImports = 0;

            for (const orderData of ordersData) {
                try {
                    const order = new Order();

                    if (orderData.userId) {
                        const user = await db.user.findOne(orderData.userId);
                        user && (order.user = user);
                    }

                    order.deliveryAddress = orderData.deliveryAddress;
                    order.orderDate = new Date(orderData.orderDate);
                    order.status = orderData.status;
                    order.note = orderData.note;

                    db.order.create(order);
                    successfulImports++;
                } catch (err) {
                    console.error(`Error processing order ${orderData.id}:`, err);
                }
            }

            await em.flush();
            res.json({
                importedRecords: successfulImports
            });
        });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing the uploaded file');
    }
});

export default router;