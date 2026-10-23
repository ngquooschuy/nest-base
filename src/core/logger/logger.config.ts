import { randomUUID } from 'node:crypto';
import type { ConfigType } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import type { appConfig } from '@config/app.config';

export function loggerConfig(app: ConfigType<typeof appConfig>): Params {
  const isProd = app.env === 'production';

  return {
    pinoHttp: {
      level: isProd ? 'info' : 'debug',

      // Dev: log 1 dòng có màu, dễ đọc. Production: JSON thuần cho máy đọc
      transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'SYS:HH:MM:ss',
            },
          },

      // Request ID: dùng lại id client gửi lên nếu có, nếu không thì tự sinh
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id =
          typeof incoming === 'string' && incoming ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },

      // Mức log theo status: 5xx → error, 4xx → warn, còn lại → info
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },

      // KHÔNG BAO GIỜ ghi token, cookie hay mật khẩu vào log
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
    },
  };
}
