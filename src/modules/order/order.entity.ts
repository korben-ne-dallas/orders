import { Entity, Index, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { User } from "../user/user.entity";

@Entity({ tableName: "orders" })
export class Order {
    @PrimaryKey()
    id!: number;

    @ManyToOne({ entity: () => User, eager: true })
    @Index()
    user?: User

    @Property()
    deliveryAddress!: string

    @Property()
    orderDate!: Date

    @Property()
    @Index()
    status!: string //TODO change it to enum

    @Property({ type: 'text'})
    note?: string
}