'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20250530161358 extends Migration {

  async up() {
    this.addSql('alter table "products" add column "is_public" boolean not null default true;');
  }

  async down() {
    this.addSql('alter table "products" drop column "is_public";');
  }

}
exports.Migration20250530161358 = Migration20250530161358;
