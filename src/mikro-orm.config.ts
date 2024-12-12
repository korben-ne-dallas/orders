import { defineConfig, Options, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const options = {} as Options;

options.metadataProvider = TsMorphMetadataProvider;

export default defineConfig({
    driver: PostgreSqlDriver,
    dbName: 'orders-app', //TODO mode to env file
    host: 'localhost', //TODO think how to path this in docker and kubernetes
    user: 'postgres', //TODO move to env file
    password: 'postgres', //TODO move to env file
    entities: ['dist/modules/**/*.entity.js'],
    debug: true,
    highlighter: new SqlHighlighter(),
    ...options,
});
