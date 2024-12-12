import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "users" })
export class User {
    @PrimaryKey()
    id!: number;

    @Property()
    email!: string;

    @Property()
    password!: string
}