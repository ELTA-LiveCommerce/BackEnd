'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20250528200626 extends Migration {

  async up() {
    this.addSql('alter table "streams" drop column if exists "current_viewers";');
  }

  async down() {
    this.addSql('alter table "streams" add column "current_viewers" int not null default 0;');
  }

}
exports.Migration20250528200626 = Migration20250528200626;
