import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecretGuard } from 'src/authentication/guards/api-secret.guard';
import { PostService } from '../services/post.service';
import { AuthGuard } from '@nestjs/passport';
import { GetPostsDto } from '../dto/get-posts.dto';
import { CreatePostDto } from '../dto';
import { GetUser } from 'src/authentication/decorators/get-user.decorator';
import { User } from 'src/authentication/entities';
import { GetPostFromId } from '../decorators/get-post.decorator';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { GetCommentsDto } from '../dto/get-comments.dto';
import { SearchPostDto } from '../dto/search-post.dto';

@UseGuards(ApiSecretGuard, AuthGuard())
@Controller('post')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Get('get')
    async getPaginatedPost(@Query() query: GetPostsDto, @GetUser() user?: User) {
        const { page, page_size } = query;
        return this.postService.getPosts(page, page_size, user)
    }

    @Post('create')
    async createPost(@Body() post: CreatePostDto, @GetUser() user: User) {
        return this.postService.createPost(post, user);
    }

    @Post('like')
    async likePost(@GetPostFromId() post:string , @GetUser() user: User) {
        return this.postService.likePost(post, user);
    }

    @Delete('like')
    async unlikePost(@GetPostFromId() post:string , @GetUser() user: User) {
        return this.postService.unlikePost(post , user);
    }

    @Post('favorite')
    async favoritePost(@GetPostFromId() post: string, @GetUser() user: User) {
        return this.postService.favoritePost(post, user);
    }

    @Delete('favorite')
    async unfavoritePost(@GetPostFromId() post: string, @GetUser() user: User) {
        return this.postService.unfavoritePost(post, user);
    }

    @Post('comment')
    async commentPost(@GetPostFromId() post: string, @GetUser() user: User, @Body() comment: CreateCommentDto ) {
        return this.postService.createComment(post, user, comment);
    }

    @Post('comments')
    async getPostComment(@GetPostFromId() post: string, @Query() query: GetCommentsDto) {
        return this.postService.getComments(post, query.page, query.page_size);
    }

    @Get('favorite-post')
    async getFavoritePost(@GetUser() user: User, @Query() query: GetPostsDto) {
        return this.postService.getFavoritepost(query.page, query.page_size, user);
    }

    @Get('user-post')
    async getUserPost(@GetUser() user: User, @Query() query: GetPostsDto) {
        return this.postService.getUserPost(query.page, query.page_size, user);
    }

    @Post('search-post')
    async getSearchedPost(@GetUser() user: User, @Query() query: GetPostsDto, @Body() search: SearchPostDto) {
        return this.postService.getSearchedPost(query.page, query.page_size, search, user);
    }
}
