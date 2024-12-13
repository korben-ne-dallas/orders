import 'dotenv/config';
import app from './app';
import { initORM } from "./db";
import { initSubscriber } from "./pubsub/subscribers/subscriber";

const port: number = 3000; //TODO move to env file

(async () => {
    await initORM();
    await initSubscriber();

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
})();