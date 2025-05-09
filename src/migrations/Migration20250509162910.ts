import { Migration } from '@mikro-orm/migrations';

export class Migration20250509162910 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "payment" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "order_id" varchar(255) not null, "seller_id" varchar(255) not null, "status" text check ("status" in ('PENDING', 'COMPLETED', 'CANCELED', 'REFUNDED')) not null default 'PENDING', "amount" numeric(10,2) not null, "transaction_id" varchar(255) null, "payment_method" varchar(255) null, "notes" varchar(255) null, "completed_at" timestamptz null, "canceled_at" timestamptz null, "refunded_at" timestamptz null, constraint "payment_pkey" primary key ("id"));`);

    this.addSql(`create table "refund" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "order_id" varchar(255) not null, "payment_id" varchar(255) not null, "seller_id" varchar(255) not null, "requested_by_id" varchar(255) not null, "status" text check ("status" in ('REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED')) not null default 'REQUESTED', "reason" text check ("reason" in ('CUSTOMER_REQUEST', 'PRODUCT_DEFECT', 'WRONG_PRODUCT', 'LATE_DELIVERY', 'OTHER')) not null, "amount" numeric(10,2) not null, "description" text null, "rejection_reason" varchar(255) null, "completed_at" timestamptz null, "rejected_at" timestamptz null, constraint "refund_pkey" primary key ("id"));`);

    this.addSql(`create table "delivery" ("id" varchar(255) not null, "order_id" varchar(255) not null, "product_id" varchar(255) not null, "seller_id" varchar(255) not null, "status" text check ("status" in ('PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELED')) not null default 'PREPARING', "tracking_number" varchar(255) null, "courier_company" varchar(255) null, "shipping_address" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "shipped_at" timestamptz null, "delivered_at" timestamptz null, "canceled_at" timestamptz null, constraint "delivery_pkey" primary key ("id"));`);

    this.addSql(`create table "broadcasts" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "title" varchar(255) not null, "description" text null, "stream_key" varchar(255) not null, "is_live" boolean not null default false, "scheduled_date" date not null, "thumbnail_image" varchar(255) null, "seller_id" varchar(255) not null, constraint "broadcasts_pkey" primary key ("id"));`);

    this.addSql(`alter table "payment" add constraint "payment_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade;`);
    this.addSql(`alter table "payment" add constraint "payment_seller_id_foreign" foreign key ("seller_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "refund" add constraint "refund_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade;`);
    this.addSql(`alter table "refund" add constraint "refund_payment_id_foreign" foreign key ("payment_id") references "payment" ("id") on update cascade;`);
    this.addSql(`alter table "refund" add constraint "refund_seller_id_foreign" foreign key ("seller_id") references "users" ("id") on update cascade;`);
    this.addSql(`alter table "refund" add constraint "refund_requested_by_id_foreign" foreign key ("requested_by_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "delivery" add constraint "delivery_order_id_foreign" foreign key ("order_id") references "orders" ("id") on update cascade;`);
    this.addSql(`alter table "delivery" add constraint "delivery_product_id_foreign" foreign key ("product_id") references "products" ("id") on update cascade;`);
    this.addSql(`alter table "delivery" add constraint "delivery_seller_id_foreign" foreign key ("seller_id") references "users" ("id") on update cascade;`);

    this.addSql(`alter table "broadcasts" add constraint "broadcasts_seller_id_foreign" foreign key ("seller_id") references "users" ("id") on update cascade;`);

    this.addSql(`drop table if exists "migrations" cascade;`);

    this.addSql(`alter table "users" add column "status" text check ("status" in ('ACTIVE', 'BLOCKED', 'INACTIVE')) not null default 'ACTIVE', add column "block_reason" varchar(255) null, add column "address" varchar(255) null, add column "gender" varchar(255) null, add column "deleted_at" timestamptz null;`);

    this.addSql(`alter table "orders" alter column "total_amount" type int using ("total_amount"::int);`);
    this.addSql(`alter table "orders" alter column "total_amount" set default 0;`);

    this.addSql(`alter table "broadcast_products" drop constraint "broadcast_products_broadcast_id_unique";`);

    this.addSql(`alter table "broadcast_products" add constraint "broadcast_products_broadcast_id_foreign" foreign key ("broadcast_id") references "broadcasts" ("id") on update cascade;`);
    this.addSql(`alter table "broadcast_products" add constraint "broadcast_products_broadcast_id_product_id_unique" unique ("broadcast_id", "product_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "refund" drop constraint "refund_payment_id_foreign";`);

    this.addSql(`alter table "broadcast_products" drop constraint "broadcast_products_broadcast_id_foreign";`);

    this.addSql(`create table "migrations" ("id" serial primary key, "name" varchar(255) null, "executed_at" timestamptz(6) null default CURRENT_TIMESTAMP);`);

    this.addSql(`drop table if exists "payment" cascade;`);

    this.addSql(`drop table if exists "refund" cascade;`);

    this.addSql(`drop table if exists "delivery" cascade;`);

    this.addSql(`drop table if exists "broadcasts" cascade;`);

    this.addSql(`alter table "broadcast_products" drop constraint "broadcast_products_broadcast_id_product_id_unique";`);

    this.addSql(`alter table "broadcast_products" add constraint "broadcast_products_broadcast_id_unique" unique ("broadcast_id");`);

    this.addSql(`alter table "orders" alter column "total_amount" drop default;`);
    this.addSql(`alter table "orders" alter column "total_amount" type int4 using ("total_amount"::int4);`);

    this.addSql(`alter table "users" drop column "status", drop column "block_reason", drop column "address", drop column "gender", drop column "deleted_at";`);
  }

}
