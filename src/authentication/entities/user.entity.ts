import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Post } from 'src/app/post/entities';
import { Like } from 'src/app/post/entities/like.entity';
import { Comment } from 'src/app/post/entities/comment.entity';
import { Favorite } from 'src/app/post/entities/favorite.entity';
import { UserInfo } from './userInfo.entity';

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
  
  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToOne(() => UserInfo, (userInfo) => userInfo.user, { cascade: true })
  userInfo: UserInfo;
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
