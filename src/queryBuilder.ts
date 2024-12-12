import Knex from "knex";

export const knexQueryBuilder = Knex({
    client: 'pg',
    connection: {
        host: 'localhost', //TODO think how to path this in docker and kubernetes
        user: 'postgres',
        password: 'postgres',
        database: 'orders-app',
    },
});