import request from 'supertest';
import app from '../../src/app';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { initORM, db } from '../../src/db';
import { RequestContext } from '@mikro-orm/core';

describe('User Routes', () => {
    let pgContainer: StartedPostgreSqlContainer;

    beforeAll(async () => {
        pgContainer = await new PostgreSqlContainer()
            .withDatabase('test_db')
            .withUsername('postgres')
            .withPassword('postgres')
            .start();

        await initORM({
            clientUrl: `postgresql://${pgContainer.getUsername()}:${pgContainer.getPassword()}@${pgContainer.getHost()}:${pgContainer.getPort()}/${pgContainer.getDatabase()}`
        });

        const migrator = db.orm.getMigrator();
        await migrator.up();
    });

    afterAll(async () => {
        await db.orm.close();
        await pgContainer.stop();
    });

    beforeEach(async () => {
        await RequestContext.create(db.orm.em, async () => {
            await db.orm.em.nativeDelete('users', {});
            await db.orm.em.nativeDelete('orders', {});
        });
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
});
