import { User } from 'src/authentication/entities';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Like } from './like.entity';
import { Comment } from './comment.entity';
import { Favorite } from './favorite.entity';
import { Tag } from './tag.entity';

@Entity('post')
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id: string
    
    @Column('text')
    content: string

    @Column({name: 'text', nullable:true})
    image_url: string

    @Column('timestamp')
    time_stamp: Date

    @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string;

    @OneToMany(() => Like, (like) => like.post)
    likes: Like[];

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @OneToMany(() => Favorite, (favorite) => favorite.post)
    favorites: Favorite[];

    @ManyToMany(() => Tag, (tag) => tag.posts)
    tags: Tag[];
}