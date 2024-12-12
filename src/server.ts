import app from './app';
import { initORM } from "./db";

const port: number = 3000; //TODO move to env file

(async () => {
    await initORM();

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
})();