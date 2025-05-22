import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetPostFromId = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<string | undefined> => {
    const request = ctx.switchToHttp().getRequest();
    const postId = request.body.postId;

    if (!postId) {
      return undefined;
    }
    return postId;
  },
);
