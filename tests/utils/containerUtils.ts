import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { initORM, db } from '../../src/db';
import { initKnex, getKnexQueryBuilder } from '../../src/queryBuilder';
import { RequestContext } from '@mikro-orm/core';

export interface TestContainerSetup {
    pgContainer: StartedPostgreSqlContainer;
}

export async function setupTestContainer(): Promise<TestContainerSetup> {
    const pgContainer = await new PostgreSqlContainer()
        .withDatabase('test_db')
        .withUsername('postgres')
        .withPassword('postgres')
        .start();

    await initORM({
        clientUrl: `postgresql://${pgContainer.getUsername()}:${pgContainer.getPassword()}@${pgContainer.getHost()}:${pgContainer.getPort()}/${pgContainer.getDatabase()}`
    });

    const migrator = db.orm.getMigrator();
    await migrator.up();

    await initKnex({
        connectionString: pgContainer.getConnectionUri()
    });

    return { pgContainer };
}

export async function cleanupTestContainer(setup: TestContainerSetup) {
    await getKnexQueryBuilder().destroy();
    await db.orm.close();
    await setup.pgContainer.stop();
}

export async function resetDatabase() {
    await RequestContext.create(db.orm.em, async () => {
        await db.orm.em.nativeDelete('users', {});
        await db.orm.em.nativeDelete('orders', {});
    });
}
