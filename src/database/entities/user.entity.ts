import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Session } from './session.entity';
import Enums from 'src/utils/constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture?: string;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'blocked'], default: 'active' })
  status!: 'active' | 'inactive' | 'blocked';

  @Column({ type: 'jsonb', default: () => "'[\"user\"]'" })
  roles?: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  permissions?: string[];

  @Column({ type: 'boolean', default: false })
  phoneVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Session, (session) => session.user, { cascade: true })
  sessions!: Session[];
}
