import { BadRequestException } from '@nestjs/common';
import { UuidParamPipe, isUuidShaped } from './uuid-param.pipe';

describe('UuidParamPipe (QA-LOCAL-03)', () => {
  const pipe = new UuidParamPipe();

  it('accepts version-4 ids and seeded fixture ids alike', () => {
    expect(pipe.transform('6907b5cf-073e-4aef-afaf-fbc15256e021')).toBe('6907b5cf-073e-4aef-afaf-fbc15256e021');
    expect(pipe.transform('11111111-1111-1111-1111-cccc00000001')).toBe('11111111-1111-1111-1111-cccc00000001');
    expect(pipe.transform('AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA')).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  });

  it('turns malformed ids into a 400 instead of a Prisma 500', () => {
    for (const bad of ['abc', '', 'not-a-uuid', '11111111-1111-1111-1111-cccc0000000', '../etc/passwd', '1 OR 1=1']) {
      expect(() => pipe.transform(bad)).toThrow(BadRequestException);
    }
    expect(isUuidShaped(undefined)).toBe(false);
  });
});
