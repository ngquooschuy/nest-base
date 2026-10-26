import type { User } from '@generated/prisma/client';
import type { UserResponseDto } from './dto/user-response.dto';

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    age: user.age ?? undefined,
    role: user.role,
    createdAt: user.createdAt,
  };
}
