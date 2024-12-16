import { defineConfig, Options, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const options = {} as Options;

options.metadataProvider = TsMorphMetadataProvider;

export default defineConfig({
    driver: PostgreSqlDriver,
    dbName: process.env.DB_NAME,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    entities: ['dist/modules/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    debug: false,
    highlighter: new SqlHighlighter(),
    ...options,
});
