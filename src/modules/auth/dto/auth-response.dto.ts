import { UserResponseDto } from '@modules/users/dto/user-response.dto';

export class AuthResponseDto {
  accessToken!: string;
  /** Số giây trước khi access token hết hạn */
  expiresIn!: number;
  user!: UserResponseDto;
}
