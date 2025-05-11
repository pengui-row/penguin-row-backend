import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities';
import { Repository } from 'typeorm';

@Injectable()
export class PostService {
    constructor( 
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>
    ) {}
    async getPosts(page: number = 1, page_size:number = 10): Promise<{ 
        data: (Post & { likesCount: number; commentsCount: number })[];
        total: number;
        currentPage: number;
        pageSize: number;
     }> {
        const offset = (page - 1) * page_size;
        const [ posts, total ] = await this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .loadRelationCountAndMap('post.likesCount', 'post.likes', 'like', (qb) =>
        qb.andWhere('like.status = :status', { status: 'ACTIVE' }),
      )
      .loadRelationCountAndMap('post.commentsCount', 'post.comments', 'comment', (qb) =>
        qb.andWhere('comment.status = :status', { status: 'ACTIVE' }),
      )
      .orderBy('post.time_stamp', 'DESC')
      .skip(offset)
      .take(page_size)
      .getManyAndCount();

        if (!posts || posts.length === 0) {
        throw new NotFoundException('No se encontraron publicaciones');
        }

        return {
            data: posts as (Post & { likesCount: number; commentsCount: number })[],
            total,
            currentPage: page,
            pageSize: page_size,
        };
    }
}
