import express, { Request, Response } from 'express';
import {MikroORM} from "@mikro-orm/postgresql";
import config from './mikro-orm.config.js';

const app = express();

const port: number = 3000;

const test = async () => {
    const orm = await MikroORM.init(config);
    console.log(orm.em);
    console.log(orm.schema);
};

test();

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript + Node.js + Express with hot reload!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});