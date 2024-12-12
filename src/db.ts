import { EntityManager, MikroORM, Options } from "@mikro-orm/postgresql";
import { User } from "./modules/user/user.entity";
import config from "./mikro-orm.config";
import { UserRepository } from "./modules/user/user.repository";
import { Order } from "./modules/order/order.entity";
import { OrderRepository } from "./modules/order/order.repository";

export interface Services {
    orm: MikroORM;
    em: EntityManager;
    user: UserRepository;
    order: OrderRepository;
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
        order: orm.em.getRepository(Order)
    };
}