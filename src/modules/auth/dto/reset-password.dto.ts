import { IsNotEmpty, IsString } from 'class-validator';
import { StrongPassword } from '@shared/decorators/strong-password.decorator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @StrongPassword()
  newPassword!: string;
}
