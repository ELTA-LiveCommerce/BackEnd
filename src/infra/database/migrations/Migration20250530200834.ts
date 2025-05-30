'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const { Migration } = require('@mikro-orm/migrations');

class Migration20250530200834 extends Migration {

  async up() {
    this.addSql('alter table "seller_infos" add column "operating_start_time" varchar(255) null default \'09:00\', add column "operating_end_time" varchar(255) null default \'18:00\';');
    
    // Migrate existing data from operatingHours to new fields
    this.addSql(`
      UPDATE seller_infos
      SET 
        operating_start_time = CASE 
          WHEN operating_hours IS NOT NULL AND operating_hours LIKE '%-%' 
          THEN TRIM(SPLIT_PART(operating_hours, '-', 1))
          ELSE '09:00'
        END,
        operating_end_time = CASE 
          WHEN operating_hours IS NOT NULL AND operating_hours LIKE '%-%' 
          THEN TRIM(SPLIT_PART(operating_hours, '-', 2))
          ELSE '18:00'
        END
      WHERE operating_hours IS NOT NULL
    `);
    
    // Drop the old operatingHours column
    this.addSql('alter table "seller_infos" drop column "operating_hours";');
  }

  async down() {
    // Re-add the operatingHours column
    this.addSql('alter table "seller_infos" add column "operating_hours" varchar(255) null default \'09:00 - 18:00\';');
    
    // Restore data from separate fields
    this.addSql(`
      UPDATE seller_infos
      SET operating_hours = CONCAT(operating_start_time, ' - ', operating_end_time)
      WHERE operating_start_time IS NOT NULL AND operating_end_time IS NOT NULL
    `);
    
    // Drop the new columns
    this.addSql('alter table "seller_infos" drop column "operating_start_time";');
    this.addSql('alter table "seller_infos" drop column "operating_end_time";');
  }

}
exports.Migration20250530200834 = Migration20250530200834;
