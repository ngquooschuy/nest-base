import type { AuthResponseDto } from '../dto/auth-response.dto';

/** Kết quả nội bộ: refreshToken chỉ đi vào cookie, KHÔNG nằm trong body */
export type AuthResult = AuthResponseDto & { refreshToken: string };
