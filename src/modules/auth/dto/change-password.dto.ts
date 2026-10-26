import { IsNotEmpty, IsString } from 'class-validator';
import { StrongPassword } from '@shared/decorators/strong-password.decorator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @StrongPassword()
  newPassword!: string;
}
