import { Migration } from '@mikro-orm/migrations';

export class Migration20241212152032 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" serial primary key, "email" varchar(255) not null, "name" varchar(255) not null);`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`create table "orders" ("id" serial primary key, "user_id" int null, "delivery_address" varchar(255) not null, "order_date" timestamptz not null, "status" varchar(255) not null, "note" text null);`);
    this.addSql(`create index "orders_user_id_index" on "orders" ("user_id");`);
    this.addSql(`create index "orders_status_index" on "orders" ("status");`);

    this.addSql(`alter table "orders" add constraint "orders_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`);
  }

}
