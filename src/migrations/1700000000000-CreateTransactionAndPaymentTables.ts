import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTransactionAndPaymentTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create transactions table
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'senderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'receiverUpi',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'receiverId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
            default: "'PENDING'",
          },
          {
            name: 'transactionType',
            type: 'enum',
            enum: ['SEND', 'RECEIVE', 'REFUND'],
            default: "'SEND'",
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'referenceId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key for senderId in transactions
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Create foreign key for receiverId in transactions
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['receiverId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for transactions
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        columnNames: ['senderId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        columnNames: ['status', 'createdAt'],
      }),
    );

    // Create payments table
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'transactionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['RAZORPAY', 'CASHFREE', 'INTERNAL'],
            default: "'RAZORPAY'",
          },
          {
            name: 'providerPaymentId',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['CREATED', 'INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED'],
            default: "'CREATED'",
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'INR'",
          },
          {
            name: 'method',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'paymentDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'capturedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key for userId in payments
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Create foreign key for transactionId in payments
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['transactionId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'transactions',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for payments
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        columnNames: ['transactionId'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        columnNames: ['providerPaymentId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop payments table
    await queryRunner.dropTable('payments', true);

    // Drop transactions table
    await queryRunner.dropTable('transactions', true);
  }
}
