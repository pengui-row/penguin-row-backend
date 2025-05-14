import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Post } from '../entities/post.entity';
import { PostService } from '../services/post.service';

export const GetPostFromId = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<Post | undefined> => {
    const request = ctx.switchToHttp().getRequest();
    const postId = request.body.postId;

    if (!postId) {
      return undefined;
    }

    const postService: PostService | undefined = request['postService'];

    if (!postService) {
      console.error("PostService no está disponible en la request. Asegúrate de inyectarlo en el controlador.");
      return undefined;
    }

    const post = await postService.findOne(postId);
    return post;
  },
);
