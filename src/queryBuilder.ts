import Knex from "knex";

type KnexConfig = {
    connectionString?: string
}

let knexQueryBuilder: Knex.Knex;

export async function initKnex(config?: KnexConfig): Promise<Knex.Knex> {
    if (!knexQueryBuilder) {
        const connection = config
            ? config
            : {
                host: process.env.DB_HOST,
                user: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            };

        knexQueryBuilder = Knex({
            client: 'pg',
            connection: connection
        });
    }

    return knexQueryBuilder;
}

export function getKnexQueryBuilder(): Knex.Knex {
    if (!knexQueryBuilder) {
        throw new Error('Knex is not initialized. Please call initKnex first!');
    }
    return knexQueryBuilder;
}
