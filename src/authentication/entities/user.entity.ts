import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /* 
      @Column('text', {
    unique: true,
  })
  userEmail: string;
  */

  @Column('text', {
    select: false,
  })
  password: string;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  @JoinColumn()
  profile: Profile;

  /* 
      @BeforeInsert()
  checkFieldsBeforeInsert() {
    this.userEmail = this.userEmail.toLowerCase().trim();
  }

    @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }

  */
}
