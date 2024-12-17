import request from 'supertest';
import app from '../../src/app';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { db } from '../../src/db';
import { RequestContext } from '@mikro-orm/core';
import { User } from "../../src/modules/user/user.entity";
import  { cleanupTestContainer, resetDatabase, setupTestContainer } from '../utils/containerUtils';
import { initializePubSub } from '../../src/pubsub/publishers/publisher';

jest.mock('@google-cloud/pubsub', () => {
    return {
        PubSub: jest.fn().mockImplementation(() => ({
            topic: jest.fn().mockReturnValue({
                exists: () => [true],
                subscription: () => ({
                    exists: () => [true]
                }),
                publishMessage: jest.fn(),  // Use the mocked function here
            }),
        }))
    };
});

describe('User Routes', () => {
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

    it('should fetch all users', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const user = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            await db.em.persistAndFlush(user);

            const response = await request(app).get('/api/user');
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].email).toBe('will@smith.com');
        });
    });

    it('should create a new user', async () => {
        const user = new User();
        user.email = 'newuser@test.com';
        user.name = 'New User';

        const response = await request(app)
            .post('/api/user')
            .send(user);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            email: user.email,
            name: user.name
        });
    });

    it('should create a new user and publish a message to pub/sub', async () => {
        const { topic } = await initializePubSub();

        const user = new User();
        user.email = 'user@test.com';
        user.name = 'New User';

        const response = await request(app)
            .post('/api/user')
            .send(user);

        const stringifyData = JSON.stringify({ userId: response.body.id });
        const bufferData = Buffer.from(stringifyData);

        expect(topic.publishMessage).toBeCalledWith({ data: bufferData });
    });

    it('should not create a new user if email is empty', async () => {
        const user = new User();
        user.name = 'New User';

        const response = await request(app)
            .post('/api/user')
            .send(user);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: '"email" and "name" are required fields!'
        });
    });

    it('should not create a new user if name is empty', async () => {
        const user = new User();
        user.email = 'newuser@test.com';

        const response = await request(app)
            .post('/api/user')
            .send(user);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: '"email" and "name" are required fields!'
        });
    });

    it('should not create a new user if email already in use', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const initialUser = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            await db.em.persistAndFlush(initialUser);

            const user = new User();
            user.email = 'will@smith.com';
            user.name = 'New User';

            const response = await request(app)
                .post('/api/user')
                .send(user);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                error: 'Email already in use!'
            });
        });
    });

    it('should update user name', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const initialUser = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            await db.em.persistAndFlush(initialUser);

            const user = new User();
            user.name = 'Mr Will Smith';

            const response = await request(app)
                .put(`/api/user/${initialUser.id}`)
                .send(user);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                name: user.name,
                id: initialUser.id,
                email: initialUser.email
            });
        });
    });

    it('should update user email', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const initialUser = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            await db.em.persistAndFlush(initialUser);

            const user = new User();
            user.email = 'will@gmail.com';

            const response = await request(app)
                .put(`/api/user/${initialUser.id}`)
                .send(user);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                email: user.email,
                id: initialUser.id,
                name: initialUser.name
            });
        });
    });

    it('should not update user email if it is already in use', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const firstUser = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            const secondUser = db.user.create({ email: 'user@test.com', name: 'Test User' });
            await db.em.persistAndFlush([firstUser, secondUser]);

            const user = new User();
            user.email = 'will@smith.com';

            const response = await request(app)
                .put(`/api/user/${secondUser.id}`)
                .send(user);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                error: 'Email already in use!'
            });
        });
    });

    it('should not update user if id is wrong', async () => {
        const user = new User();
        user.email = 'will@smith.com';

        const response = await request(app)
            .put('/api/user/123')
            .send(user);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: 'No user with such id!'
        });
    });

    it('should delete user by id', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const user = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            await db.em.persistAndFlush(user);

            const response = await request(app)
                .delete(`/api/user/${user.id}`);

            const noUser = await db.user.findOne(user.id);

            expect(response.status).toBe(200);
            expect(noUser).toBe(null);
            expect(response.body).toMatchObject({
                email: user.email,
                name: user.name
            });
        });
    });

    it('should not delete user if id is wrong', async () => {
        const response = await request(app)
            .delete('/api/user/123');

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
            error: 'No user with such id!'
        });
    });

    it('should return top user with zero orders', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const user = db.user.create({ email: 'will@smith.com', name: 'Will Smith' });
            await db.em.persistAndFlush(user);

            const response = await request(app)
                .get('/api/user/top?n=1');

            expect(response.status).toBe(200);
            expect(response.body[0]).toMatchObject({
                id: user.id,
                name: user.name,
                count: '0'
            });
        });
    });

    it('should return top 3 users with the biggest number of orders', async () => {
        await RequestContext.create(db.orm.em, async () => {
            const firstUser = db.user.create({ email: 'first@user.com', name: 'First' });
            const secondUser = db.user.create({ email: 'second@user.com', name: 'Second' });
            const thirdUser = db.user.create({ email: 'third@user.com', name: 'Third' });
            await db.em.persistAndFlush([firstUser, secondUser, thirdUser]);

            // First user: 2 orders, second user: 1 order, third user: 3 orders
            const firstOrder = db.order.create({ user: firstUser, orderDate: "10/11/2024", deliveryAddress: "Some street 5", status: "RECEIVED" });
            const secondOrder = db.order.create({ user: firstUser, orderDate: "10/11/2024", deliveryAddress: "Some street 5", status: "RECEIVED" });
            const thirdOrder = db.order.create({ user: secondUser, orderDate: "10/11/2024", deliveryAddress: "Some street 5", status: "RECEIVED" });
            const fourthOrder = db.order.create({ user: thirdUser, orderDate: "10/11/2024", deliveryAddress: "Some street 5", status: "RECEIVED" });
            const fifthOrder = db.order.create({ user: thirdUser, orderDate: "10/11/2024", deliveryAddress: "Some street 5", status: "RECEIVED" });
            const sixthOrder = db.order.create({ user: thirdUser, orderDate: "10/11/2024", deliveryAddress: "Some street 5", status: "RECEIVED" });
            await db.em.persistAndFlush([firstOrder, secondOrder, thirdOrder, fourthOrder, fifthOrder, sixthOrder]);

            const response = await request(app)
                .get('/api/user/top?n=3');

            expect(response.status).toBe(200);
            expect(response.body[0]).toMatchObject({
                id: thirdUser.id,
                name: thirdUser.name,
                count: '3'
            });
            expect(response.body[1]).toMatchObject({
                id: firstUser.id,
                name: firstUser.name,
                count: '2'
            });
            expect(response.body[2]).toMatchObject({
                id: secondUser.id,
                name: secondUser.name,
                count: '1'
            });
        });
    });

    it('should return bad request if n parameter is missing', async () => {
        const response = await request(app)
            .get('/api/user/top');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            error: 'Request should contain n={n} query parameter!'
        });
    });
});
