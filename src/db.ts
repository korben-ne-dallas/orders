import { EntityManager, MikroORM, Options } from "@mikro-orm/postgresql";
import { User } from "./modules/user/user.entity";
import config from "./mikro-orm.config";
import { UserRepository } from "./modules/user/user.repository";

export interface Services {
    orm: MikroORM;
    em: EntityManager;
    user: UserRepository;
}

export let db: Services;

export async function initORM(options?: Options): Promise<Services> {
    if (db) {
        return db;
    }

    const orm = await MikroORM.init({
        ...config,
        ...options
    });

    return db = {
        orm,
        em: orm.em,
        user: orm.em.getRepository(User),
    };
}