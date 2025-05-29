import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment, Favorite, Like, Post, Tag } from '../entities';
import { In, Repository } from 'typeorm';
import { CreatePostDto } from '../dto';
import { User } from 'src/authentication/entities';
import { Status } from '../enums/status.enum';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { SearchPostDto } from '../dto/search-post.dto';

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Tag)
        private readonly tagRepository: Repository<Tag>,
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,
        @InjectRepository(Favorite)
        private readonly favoriteRepository: Repository<Favorite>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) {}

    async findOne(id: string): Promise<Post | undefined> {
      return this.postRepository.findOne({ where: { id } });
    }

    async getPosts(page: number = 1, page_size:number = 10, user?: User): Promise<{
      data: (Post & { likesCount: number; commentsCount: number; tags: string[]; user: { name: string; lastName: string }; isLiked:boolean; isFavorite:boolean })[];
      total: number;
      currentPage: number;
      pageSize: number;
     }> {
        const offset = (page - 1) * page_size;
        const queryBuilder = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('post.tags', 'tag')
      .loadRelationCountAndMap('post.likesCount', 'post.likes', 'like', (qb) =>
        qb.andWhere('like.status = :status', { status: 'ACTIVE' }),
      )
      .loadRelationCountAndMap('post.commentsCount', 'post.comments', 'comment', (qb) =>
        qb.andWhere('comment.status = :status', { status: 'ACTIVE' }),
      )
      queryBuilder
      .orderBy('post.time_stamp', 'DESC')
      .skip(offset)
      .take(page_size)
      .getManyAndCount();

      const [posts, total] = await queryBuilder.getManyAndCount();
        if (!posts || posts.length === 0) {
        throw new NotFoundException('No se encontraron publicaciones');
        }
      //agregar si el post tiene like y/o favorito del usuario
      let userLikedPostIds: Set<string> = new Set();
      let userFavoritePostIds: Set<string> = new Set();
      if (user) {
        const postIds = posts.map(post => post.id);
        if (postIds.length > 0) {
          const userLikes = await this.likeRepository.find({
            where: {
            userId: user.id,
            postId: In(postIds),
            status: Status.ACTIVE,
            },
            select: ['postId'],
          });
        userLikedPostIds = new Set(userLikes.map(like => like.postId));
        const userFavorites = await this.favoriteRepository.find({
          where: {
            userId: user.id,
            postId: In(postIds),
            status: Status.ACTIVE,
          },
          select: ['postId'],
        });
        userFavoritePostIds = new Set(userFavorites.map(favorite => favorite.postId));
      }
    }

        // Transformar la respuesta
        const postsWithUserData = posts.map((post: any) => ({
          ...post,
          tags: post.tags.map(tag => tag.name),
          user: {
          name: post.user.profile ? post.user.profile.name : null,
          lastName: post.user.profile ? post.user.profile.lastName : null,
          },
          isLiked: user ? userLikedPostIds.has(post.id) : false,
          isFavorite: user ? userFavoritePostIds.has(post.id) : false,
    }));
        return {
            data: postsWithUserData,
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

    async likePost(post: string , user:User) {
      try {
        const existingLike = await this.likeRepository.findOne({
          where: {
            user: { id: user.id },
            post: { id: post }
          },
          select: ['id', 'status', 'userId', 'postId']
        });

        if (existingLike) {
          existingLike.status = Status.ACTIVE;
          return this.likeRepository.save(existingLike);
        }
        else {
          const newLike = this.likeRepository.create({
          postId: post,
          status: Status.ACTIVE,
          user: user,
          userId: user.id
          });
          return this.likeRepository.save(newLike);
        }
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    async unlikePost(post: string, user:User) {
      try {
        const updateLike = await this.likeRepository.findOne({
      where: {
        user: { id: user.id },
        post: { id: post },
        status: Status.ACTIVE
      },
      select: ['id', 'status', 'userId', 'postId'],
      relations: {
        user: false,
        post: false,
      },
      });
      if (!updateLike) {
      throw new NotFoundException(`Like no encontrado para el usuario ${user.id} y el post ${post}`);
      }

      updateLike.status = Status.INACTIVE;
      return this.likeRepository.save(updateLike);
      } catch (error) {
        this.handleDBErrors(error);
      }
    }

    async favoritePost(post: string, user:User) {
      try {
        const existingFavorite = await this.favoriteRepository.findOne({
          where: {
            user: { id: user.id },
            post: { id: post }
          },
          select: ['status', 'userId', 'postId']
        });

        if (existingFavorite) {
          existingFavorite.status = Status.ACTIVE;
          return this.favoriteRepository.save(existingFavorite);
        }
        else {
          const newFavorite = this.favoriteRepository.create({
            postId: post,
            status: Status.ACTIVE,
            user: user,
            userId: user.id
          });
          return this.favoriteRepository.save(newFavorite);
        }
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    async unfavoritePost(post: string, user:User) {
      try {
        const updatedFavorite = await this.favoriteRepository.findOne({
          where: {
            user: { id: user.id },
            post: { id: post }
          },
          select: ['status', 'userId', 'postId'],
          relations: {
            user: false,
            post: false,
          },
        });

        if (!updatedFavorite) {
          throw new NotFoundException(`Favorito no encontrado para el usuario ${user.id} y el post ${post}`);
        }

        updatedFavorite.status = Status.INACTIVE;
        return this.favoriteRepository.save(updatedFavorite);
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    async createComment(post: string, user: User, comment: CreateCommentDto) {
      try {
        const newComment = this.commentRepository.create({
          user: user,
          postId: post,
          userId: user.id,
          content: comment.content,
          status: Status.ACTIVE
        });
        return this.commentRepository.save(newComment);
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    async getComments(postId: string, page: number = 1, page_size: number = 10) {
      try {
        const offset = (page - 1) * page_size;

        const [comments, total] = await this.commentRepository.createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('comment.status = :status', { status: Status.ACTIVE })
        .andWhere('comment.postId = :post', { post: post })
        .orderBy('comment.createdAt', 'DESC')
        .skip(offset)
        .take(page_size)
        .getManyAndCount()

        if (!comments || comments.length === 0) {
          throw new NotFoundException('No se encontraron comentarios.');
        }

        const commentsWithUser = comments.map((comment:any) => ({
          ...comment,
          user: {
            name: comment.user.profile ? comment.user.profile.name : null,
            lastName: comment.user.profile ? comment.user.profile.lastName : null,
          },
        }));
        return {
        data: commentsWithUser,
        total,
        currentPage: page,
        pageSize: page_size,
      };
      } catch (error) {
        // El manejador de errores existente se encargará de otros problemas
        this.handleDBErrors(error);
      }
    }

    async getFavoritepost(page: number = 1, page_size: number = 10, user: User) {
      try {
        if (!user || !user.id) {
          throw new InternalServerErrorException('El usuario es requerido para obtener posts favoritos.');
          }

        const offset = (page - 1) * page_size;

        const queryBuilder = this.postRepository.createQueryBuilder('post')
          .leftJoinAndSelect('post.user', 'user')
          .leftJoinAndSelect('user.profile', 'profile')
          .leftJoinAndSelect('post.tags', 'tag')
          .innerJoin('post.favorites', 'favorite', 'favorite.userId = :userId AND favorite.status = :status', {
            userId: user.id,
            status: Status.ACTIVE,
          })
          .loadRelationCountAndMap(
            'post.likesCount',
            'post.likes',
            'like',
            (qb) => qb.andWhere('like.status = :status', { status: Status.ACTIVE }),
          )
          .loadRelationCountAndMap(
            'post.commentsCount',
            'post.comments',
            'comment',
            (qb) => qb.andWhere('comment.status = :status', { status: Status.ACTIVE }),
          );

        queryBuilder
          .orderBy('post.time_stamp', 'DESC')
          .skip(offset)
          .take(page_size);

        const [posts, total] = await queryBuilder.getManyAndCount();

        if (!posts || posts.length === 0) {
          throw new NotFoundException('No se encontraron publicaciones favoritas para este usuario.');
        }

        let userLikedPostIds: Set<string> = new Set();

        if (user) {
          const postIds = posts.map(post => post.id);
          if (postIds.length > 0) {
            const userLikes = await this.likeRepository.find({
              where: {
                userId: user.id,
                postId: In(postIds),
                status: Status.ACTIVE,
              },
              select: ['postId'],
            });
            userLikedPostIds = new Set(userLikes.map(like => like.postId));
          }
        }

        const postsWithUserData = posts.map((post: any) => ({
          ...post,
          tags: post.tags.map((tag: any) => tag.name),
          user: {
            name: post.user.profile ? post.user.profile.name : null,
            lastName: post.user.profile ? post.user.profile.lastName : null,
          },
          isLiked: user ? userLikedPostIds.has(post.id) : false,
          isFavorite: true,
        }));

        return {
          data: postsWithUserData,
          total,
          currentPage: page,
          pageSize: page_size,
        };
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    async getUserPost(page:number = 1, page_size:number = 10, user: User) {
    try {
        if (!user || !user.id) {
          throw new InternalServerErrorException('El usuario es requerido para obtener sus posts.');
        }

      const offset = (page - 1) * page_size;

      const queryBuilder = this.postRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('post.tags', 'tag')
        .where('post.userId = :userId', { userId: user.id })
        .loadRelationCountAndMap(
          'post.likesCount',
          'post.likes',
          'like',
          (qb) => qb.andWhere('like.status = :status', { status: Status.ACTIVE }),
        )
        .loadRelationCountAndMap(
          'post.commentsCount',
          'post.comments',
          'comment',
          (qb) => qb.andWhere('comment.status = :status', { status: Status.ACTIVE }),
        );

      queryBuilder
        .orderBy('post.time_stamp', 'DESC')
        .skip(offset)
        .take(page_size);

      const [posts, total] = await queryBuilder.getManyAndCount();

      if (!posts || posts.length === 0) {
        throw new NotFoundException('No se encontraron publicaciones creadas por este usuario.');
      }

      let userLikedPostIds: Set<string> = new Set();
      let userFavoritePostIds: Set<string> = new Set();
      const postIds = posts.map(post => post.id);
      if (postIds.length > 0) {
        const userLikes = await this.likeRepository.find({
          where: {
            userId: user.id,
            postId: In(postIds),
            status: Status.ACTIVE,
          },
          select: ['postId'],
        });
        userLikedPostIds = new Set(userLikes.map(like => like.postId));

        const userFavorites = await this.favoriteRepository.find({
          where: {
            userId: user.id,
            postId: In(postIds),
            status: Status.ACTIVE,
          },
          select: ['postId'],
        });
        userFavoritePostIds = new Set(userFavorites.map(favorite => favorite.postId));
      }

      const postsWithUserData = posts.map((post: any) => ({
        ...post,
        tags: post.tags.map((tag: any) => tag.name),
        user: {
          name: post.user.profile ? post.user.profile.name : null,
          lastName: post.user.profile ? post.user.profile.lastName : null,
        },
        isLiked: user ? userLikedPostIds.has(post.id) : false,
        isFavorite: user ? userFavoritePostIds.has(post.id) : false,
      }));

      return {
        data: postsWithUserData,
        total,
        currentPage: page,
        pageSize: page_size,
      };
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    async getSearchedPost(page:number = 1, page_size:number = 10,  search: SearchPostDto, user?: User) {
      try {
      const offset = (page - 1) * page_size;
      const queryBuilder = this.postRepository.createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('post.tags', 'tag')
        .where('post.content LIKE :searchContent', { searchContent: `%${search.search}%` })
        .loadRelationCountAndMap(
          'post.likesCount',
          'post.likes',
          'like',
          (qb) => qb.andWhere('like.status = :status', { status: Status.ACTIVE }),
        )
        .loadRelationCountAndMap(
          'post.commentsCount',
          'post.comments',
          'comment',
          (qb) => qb.andWhere('comment.status = :status', { status: Status.ACTIVE }),
        );

      queryBuilder
        .orderBy('post.time_stamp', 'DESC')
        .skip(offset)
        .take(page_size);

      const [posts, total] = await queryBuilder.getManyAndCount();

      if (!posts || posts.length === 0) {
        throw new NotFoundException(`No se encontraron publicaciones que contengan "${search.search}".`);
      }

      let userLikedPostIds: Set<string> = new Set();
      let userFavoritePostIds: Set<string> = new Set();

      if (user) {
        const postIds = posts.map(post => post.id);
        if (postIds.length > 0) {
          const userLikes = await this.likeRepository.find({
            where: {
              userId: user.id,
              postId: In(postIds),
              status: Status.ACTIVE,
            },
            select: ['postId'],
          });
          userLikedPostIds = new Set(userLikes.map(like => like.postId));

          const userFavorites = await this.favoriteRepository.find({
            where: {
              userId: user.id,
              postId: In(postIds),
              status: Status.ACTIVE,
            },
            select: ['postId'],
          });
          userFavoritePostIds = new Set(userFavorites.map(favorite => favorite.postId));
        }
      }

      const postsWithUserData = posts.map((post: any) => ({
        ...post,
        tags: post.tags.map((tag: any) => tag.name),
        user: {
          name: post.user.profile ? post.user.profile.name : null,
          lastName: post.user.profile ? post.user.profile.lastName : null,
        },
        isLiked: user ? userLikedPostIds.has(post.id) : false,
        isFavorite: user ? userFavoritePostIds.has(post.id) : false,
      }));

      return {
        data: postsWithUserData,
        total,
        currentPage: page,
        pageSize: page_size,
      };
      } catch (error) {
        this.handleDBErrors(error)
      }
    }

    private handleDBErrors(error: any): never {
        if (error.code === '23505') throw new BadRequestException(error.detail);

        console.log(error);

        throw new InternalServerErrorException('Please check server logs');
    }
}
