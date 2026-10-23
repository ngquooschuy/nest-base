import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải có cả chữ và số',
  })
  password!: string;

  @IsString()
  @Length(2, 50)
  fullName!: string;

  @IsOptional() // không gửi thì bỏ qua; có gửi thì phải đúng các rule bên dưới
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;
}
