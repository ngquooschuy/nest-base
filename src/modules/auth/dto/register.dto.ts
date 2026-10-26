import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';

// Tái dùng rule của CreateUserDto, chỉ lấy 3 field. Người dùng không tự chọn role được!
export class RegisterDto extends PickType(CreateUserDto, [
  'email',
  'password',
  'fullName',
]) {}
