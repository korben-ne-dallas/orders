import { Collection, Entity, OneToMany, PrimaryKey, Property, Unique } from "@mikro-orm/core";
import { Order } from "../order/order.entity";

@Entity({ tableName: "users" })
export class User {
    @PrimaryKey()
    id!: number;

    @Property()
    @Unique()
    email!: string;

    @Property()
    name!: string

    @OneToMany(() => Order, order => order.user)
    orders = new Collection<Order>(this);

    @Property()
    verified?: boolean
}