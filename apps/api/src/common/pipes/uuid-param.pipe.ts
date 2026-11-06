import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Accepts any RFC 4122-shaped identifier (8-4-4-4-12 hex). Prisma rejects
 * anything else with a 500, so malformed ids become a 400 before they reach a
 * query (QA-LOCAL-03). The check is deliberately looser than a v4-only
 * validator: seeded fixtures and imported records are not all version 4.
 */
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidShaped(value: unknown): value is string {
  return typeof value === 'string' && UUID_SHAPE.test(value);
}

@Injectable()
export class UuidParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUuidShaped(value)) {
      throw new BadRequestException('INVALID_ID: route parameter must be a UUID');
    }
    return value.toLowerCase();
  }
}
