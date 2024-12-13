import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import config from "../mikro-orm.config";
import * as fs from 'fs';
import * as path from 'path';
import { User } from "../modules/user/user.entity";


async function run() {
    const orm = await MikroORM.init(config);

    console.log('Start migrations');
    await orm.getMigrator().up();
    console.log('Migrations applied successfully');

    console.log('Start data import');
    const filePath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const em = orm.em.fork();

    for (const user of data) {
        const createdUser = em.create(User, user);
        await em.persistAndFlush(createdUser);
    }

    console.log('Data imported');
    await orm.close();
}

run().catch(console.error);
