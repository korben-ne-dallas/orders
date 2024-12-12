import express from 'express';
import routes from './modules/routes';
import {RequestContext} from "@mikro-orm/core";
import { db } from "./db";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    RequestContext.create(db.orm.em, next);
});

app.use('/', routes);

export default app;
