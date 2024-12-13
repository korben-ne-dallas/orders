import express, { ErrorRequestHandler } from 'express';
import fileUpload from 'express-fileupload';
import routes from './modules/routes';
import {RequestContext} from "@mikro-orm/core";
import { db } from "./db";

const app = express();

app.use(express.json());
app.use(fileUpload({
    useTempFiles: false,
    tempFileDir: '',
}));

app.use((req, res, next) => {
    RequestContext.create(db.orm.em, next);
});

app.use('/api', routes);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('An error occurred:', err.message || err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
};

app.use(errorHandler);

export default app;
