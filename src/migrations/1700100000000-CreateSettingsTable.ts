import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSettingsTable1700100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'string'",
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create index on key column for faster lookups
    await queryRunner.createIndex(
      'settings',
      new TableIndex({
        columnNames: ['key'],
        isUnique: true,
      }),
    );

    // Insert default settings
    await queryRunner.query(`
      INSERT INTO settings (id, key, value, description, type, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), 'payment_provider', 'RAZORPAY', 'Default payment provider (RAZORPAY or CASHFREE)', 'string', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'otp_expiry', '300', 'OTP expiry time in seconds', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'max_transaction_amount', '100000', 'Maximum transaction amount in rupees', 'number', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('settings', true);
  }
}
