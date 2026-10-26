export class UserResponseDto {
  /** UUID của user */
  id!: string;
  /** @example huy@example.com */
  email!: string;
  fullName!: string;
  age?: number;
  role!: string;
  createdAt!: Date;
}
