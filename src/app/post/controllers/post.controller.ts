import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiSecretGuard } from 'src/authentication/guards/api-secret.guard';
import { PostService } from '../services/post.service';
import { AuthGuard } from '@nestjs/passport';
import { GetPostsDto } from '../dto/get-posts.dto';

@UseGuards(ApiSecretGuard, AuthGuard())
@Controller('post')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Get('get')
    async getPaginatedPost(@Query() query: GetPostsDto) {
        const { page, page_size } = query;
        return this.postService.getPosts(page, page_size)
    }
}
