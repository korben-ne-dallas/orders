import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { cleanupTestContainer, resetDatabase, setupTestContainer } from "../utils/containerUtils";
import { RequestContext } from "@mikro-orm/core";
import { db } from "../../src/db";
import request from "supertest";
import app from "../../src/app";
import { Order } from "../../src/modules/order/order.entity";

describe('Order Routes', () => {
    let testSetup: { pgContainer: StartedPostgreSqlContainer };

    beforeAll(async () => {
        testSetup = await setupTestContainer();
    });

    afterAll(async () => {
        await cleanupTestContainer(testSetup);
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    it('should return order by id', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const order = db.order.create({ orderDate: '10/11/2024', deliveryAddress: 'Some street 5', status: 'RECEIVED' });
            await db.em.persistAndFlush(order);

            const response = await request(app)
                .get(`/api/order/${order.id}`);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: order.id,
                orderDate: '2024-10-11T00:00:00.000Z',
                deliveryAddress: order.deliveryAddress,
                status: order.status
            });
        });
    });

    it('should create a new order', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const order = new Order();
            order.orderDate = new Date('2024-10-10T22:00:00.000Z');
            order.deliveryAddress = 'Some street 5';
            order.status = 'RECEIVED';
            order.note = 'Additional note';

            const response = await request(app)
                .post('/api/order')
                .send(order);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                orderDate: order.orderDate.toISOString(),
                deliveryAddress: order.deliveryAddress,
                status: order.status,
                note: order.note
            });
        });
    });

    it('should create a new order and assign it to the user', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const user = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            await db.em.persistAndFlush(user);

            const order = new Order();
            order.orderDate = new Date('2024-10-10T22:00:00.000Z');
            order.deliveryAddress = 'Some street 5';
            order.status = 'RECEIVED';
            order.note = 'Additional note';

            const response = await request(app)
                .post('/api/order')
                .send( { ...order, userId: user.id });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                orderDate: order.orderDate.toISOString(),
                deliveryAddress: order.deliveryAddress,
                status: order.status,
                note: order.note
            });
            expect(response.body.user.id).toBe(user.id);
        });
    });

    it('should not create a new order if one of required fields is missing', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const order = new Order();
            order.orderDate = new Date('2024-10-10T22:00:00.000Z');
            order.status = 'RECEIVED';

            const response = await request(app)
                .post('/api/order')
                .send(order);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                error: '"deliveryAddress", "orderDate" and "status" are required!'
            });
        });
    });
});