import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// Mọi field đều trở thành optional nhưng vẫn giữ nguyên các rule validate
export class UpdateUserDto extends PartialType(CreateUserDto) {}
