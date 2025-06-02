import { Migration } from '@mikro-orm/migrations';

class Migration20250528200626 extends Migration {

  async up() {
    // Temporarily commented out - table doesn't exist yet
    // this.addSql('alter table "streams" drop column if exists "current_viewers";');
  }

  async down() {
    this.addSql('alter table "streams" add column "current_viewers" int not null default 0;');
  }

}

export { Migration20250528200626 };
