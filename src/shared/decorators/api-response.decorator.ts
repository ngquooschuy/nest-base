import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PageMetaDto } from '@shared/dto/page-meta.dto';

const base = {
  success: { type: 'boolean', example: true },
  timestamp: { type: 'string', format: 'date-time' },
};

/** Response thành công: { success, data: T, timestamp } */
export const ApiOkWrapped = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: { properties: { ...base, data: { $ref: getSchemaPath(model) } } },
    }),
  );

/** Response phân trang: { success, data: T[], meta, timestamp } */
export const ApiPaginatedResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(model, PageMetaDto),
    ApiOkResponse({
      schema: {
        properties: {
          ...base,
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PageMetaDto) },
        },
      },
    }),
  );
