import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty() // KHÔNG kiểm tra độ mạnh ở đây, câu hỏi tự kiểm tra sẽ giải thích
  password!: string;
}
