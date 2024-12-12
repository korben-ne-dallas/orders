import {Collection, Entity, OneToMany, PrimaryKey, Property} from "@mikro-orm/core";
import {Order} from "../order/order.entity";

@Entity({ tableName: "users" })
export class User {
    @PrimaryKey()
    id!: number;

    @Property()
    email!: string;

    @Property()
    password!: string

    @OneToMany(() => Order, order => order.user)
    orders = new Collection<Order>(this);
}