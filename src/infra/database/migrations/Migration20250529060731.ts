import { Migration } from '@mikro-orm/migrations';

class Migration20250529060731 extends Migration {

  async up() {
    this.addSql('alter table "seller_infos" add column "operating_hours" varchar(255) null default \'09:00 - 18:00\';');
  }

  async down() {
    this.addSql('alter table "seller_infos" drop column "operating_hours";');
  }

}

export { Migration20250529060731 };
