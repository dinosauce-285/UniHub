import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../../generated/prisma/enums';

export type CurrentUserPayload = {
  id: string;
  email: string;
  role: Role;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
