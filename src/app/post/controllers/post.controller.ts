import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecretGuard } from 'src/authentication/guards/api-secret.guard';
import { PostService } from '../services/post.service';
import { AuthGuard } from '@nestjs/passport';
import { GetPostsDto } from '../dto/get-posts.dto';
import { CreatePostDto } from '../dto';
import { GetUser } from 'src/authentication/decorators/get-user.decorator';
import { User } from 'src/authentication/entities';

@UseGuards(ApiSecretGuard, AuthGuard())
@Controller('post')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Get('get')
    async getPaginatedPost(@Query() query: GetPostsDto) {
        const { page, page_size } = query;
        return this.postService.getPosts(page, page_size)
    }

    @Post('create')
    async createPost(@Body() post: CreatePostDto, @GetUser() user: User) {
        return this.postService.createPost(post, user);
    }
}
