import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities';
import { Repository } from 'typeorm';
import { CreatePostDto } from '../dto';
import { User } from 'src/authentication/entities';

@Injectable()
export class PostService {
    constructor( 
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>
    ) {}
    async getPosts(page: number = 1, page_size:number = 10): Promise<{ 
        data: (Post & { likesCount: number; commentsCount: number; tags: string[] })[];
        total: number;
        currentPage: number;
        pageSize: number;
     }> {
        const offset = (page - 1) * page_size;
        const [ posts, total ] = await this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.tags', 'tag')
      .loadRelationCountAndMap(
        'post.likesCount',
        'post.likes',
        'like',
        (qb) => qb.andWhere('like.status = :status', { status: 'ACTIVE' }),
      )
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

        // Transformar la respuesta para incluir los tags como un array de strings
        const postsWithTags = posts.map(post => ({
          ...post,
          tags: post.tags.map(tag => tag.name),
        }));
        return {
            data: postsWithTags as (Post & { likesCount: number; commentsCount: number; tags: string[] })[],
            total,
            currentPage: page,
            pageSize: page_size,
        };
    }

    async createPost(createPostDto: CreatePostDto, user:User) {
      try {
        const newPost = this.postRepository.create({
          ...createPostDto,
          user: user,
          userId: user.id,
          time_stamp: createPostDto.time_stamp || new Date(),
        });
      return this.postRepository.save(newPost);

      } catch (error) {
       this.handleDBErrors(error);
      }
    }

    private handleDBErrors(error: any): never {
        if (error.code === '23505') throw new BadRequestException(error.detail);
    
        console.log(error);
    
        throw new InternalServerErrorException('Please check server logs');
    }
}
