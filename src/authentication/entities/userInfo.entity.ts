import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/authentication/entities';

@Entity('user_info')
export class UserInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { array: true, nullable: true })
  interests: string[];

  @Column('text', { nullable: true })
  location: string;

  @Column('text', { nullable: true })
  professional_title: string;

  @Column('text', { nullable: true })
  talents: string;

  @Column('text', { nullable: true })
  experience: string;

  @OneToOne(() => User, (user) => user.userInfo, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}