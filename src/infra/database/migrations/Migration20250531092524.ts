import { Migration } from '@mikro-orm/migrations';

export class Migration20250531092524 extends Migration {

  async up() {
    this.addSql('alter table "products" add column "options" jsonb null;');
  }

  async down() {
    this.addSql('alter table "products" drop column "options";');
  }

}