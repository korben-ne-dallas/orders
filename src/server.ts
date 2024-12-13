import 'dotenv/config';
import app from './app';
import { initORM } from "./db";
import { initSubscriber } from "./pubsub/subscribers/subscriber";

const port: number = Number(process.env.SERVER_PORT) || 3000;

(async () => {
    await initORM();
    await initSubscriber();

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
})();