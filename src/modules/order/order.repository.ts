import { EntityRepository } from "@mikro-orm/postgresql";
import { Order } from "./order.entity";

export class OrderRepository extends EntityRepository<Order> {

}