import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Post, Tag } from '../entities';
import { Repository } from 'typeorm';
import { CreatePostDto, LikePostDto } from '../dto';
import { User } from 'src/authentication/entities';
import { Status } from '../enums/status.enum';

@Injectable()
export class PostService {
    constructor( 
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Tag)
        private readonly tagRepository: Repository<Tag>,
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,
    ) {}

    async findOne(id: string): Promise<Post | undefined> {
      return this.postRepository.findOne({ where: { id } });
    }

    async getPosts(page: number = 1, page_size:number = 10): Promise<{ 
        data: (Post & { likesCount: number; commentsCount: number; tags: string[]; user: { name: string; lastName: string } })[];
    total: number;
    currentPage: number;
    pageSize: number;
     }> {
        const offset = (page - 1) * page_size;
        const [ posts, total ] = await this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
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
        const postsWithUserData = posts.map(post => ({
          ...post,
          tags: post.tags.map(tag => tag.name),
          user: {
          name: post.user.profile ? post.user.profile.name : null,
          lastName: post.user.profile ? post.user.profile.lastName : null,
          },
    }));
        return {
            data: postsWithUserData as (Post & { likesCount: number; commentsCount: number; tags: string[]; user: { name: string; lastName: string } })[],
            total,
            currentPage: page,
            pageSize: page_size,
        };
    }

    async createPost(createPostDto: CreatePostDto, user:User) {
      try {
        const newPost = this.postRepository.create({
          content: createPostDto.content,
          image_url: createPostDto.image_url || null,
          user: user,
          userId: user.id,
          time_stamp: createPostDto.time_stamp || new Date(),
        });
        const savedPost = await this.postRepository.save(newPost);

      // Manejar la creación y asociación de tags
      if (createPostDto.tags && createPostDto.tags.length > 0) {
        const tags: Tag[] = [];
        for (const tagName of createPostDto.tags) {
          let tag = await this.tagRepository.findOne({ where: { name: tagName } });
          if (!tag) {
            tag = this.tagRepository.create({ name: tagName });
            await this.tagRepository.save(tag);
          }
          tags.push(tag);
        }
        savedPost.tags = tags;
        await this.postRepository.save(savedPost);
      }
      return savedPost;
      } catch (error) {
       this.handleDBErrors(error);
      }
    }

    async likePost(post: Post ,likePostDto: LikePostDto, user:User) {
      try {
        const newLike = this.likeRepository.create({
          post: post,
          postId: likePostDto.id,
          status: Status.ACTIVE,
          user: user,
          userId: user.id
        });
        return this.likeRepository.save(newLike);
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    async unlikePost(post: Post, likePostDto: LikePostDto, user:User) {
      try {
        const updateLike = await this.likeRepository.findOne({
      where: {
        user: { id: user.id },
        post: { id: likePostDto.id },
        status: Status.ACTIVE
      },
      select: ['id', 'status', 'userId', 'postId'],
      relations: {
        user: false,
        post: false,
      },
      });
      if (!updateLike) {
      throw new NotFoundException(`Like no encontrado para el usuario ${user.id} y el post ${post.id}`);
      }

      updateLike.status = Status.INACTIVE;
      return this.likeRepository.save(updateLike);
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
