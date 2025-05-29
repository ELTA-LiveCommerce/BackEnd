import { Migration } from '@mikro-orm/migrations';

class Migration20250529060657 extends Migration {

  async up() {
    this.addSql('create table "conversations" ("id" varchar(255) not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "viewer_id" varchar(255) not null, "seller_id" varchar(255) not null, "last_message_at" timestamptz(0) null, "last_message_text" text null, "viewer_unread_count" int not null default 0, "seller_unread_count" int not null default 0);');
    this.addSql('alter table "conversations" add constraint "conversations_pkey" primary key ("id");');

    this.addSql('create table "messages" ("id" varchar(255) not null, "created_at" timestamptz(0) not null default now(), "updated_at" timestamptz(0) not null default now(), "conversation_id" varchar(255) not null, "sender_id" varchar(255) not null, "text" text not null, "is_read" boolean not null default false, "read_at" timestamptz(0) null);');
    this.addSql('alter table "messages" add constraint "messages_pkey" primary key ("id");');

    this.addSql('alter table "conversations" add constraint "conversations_viewer_id_foreign" foreign key ("viewer_id") references "users" ("id") on update cascade;');
    this.addSql('alter table "conversations" add constraint "conversations_seller_id_foreign" foreign key ("seller_id") references "users" ("id") on update cascade;');

    this.addSql('alter table "messages" add constraint "messages_conversation_id_foreign" foreign key ("conversation_id") references "conversations" ("id") on update cascade;');
    this.addSql('alter table "messages" add constraint "messages_sender_id_foreign" foreign key ("sender_id") references "users" ("id") on update cascade;');
  }

  async down() {
    this.addSql('alter table "messages" drop constraint "messages_conversation_id_foreign";');

    this.addSql('drop table if exists "conversations" cascade;');

    this.addSql('drop table if exists "messages" cascade;');
  }

}

export { Migration20250529060657 };
