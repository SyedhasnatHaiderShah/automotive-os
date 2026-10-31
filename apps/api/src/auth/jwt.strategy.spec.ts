import { JwtStrategy } from './jwt.strategy';
import { dbContextStorage, DatabaseContext } from '../database/prisma.service';

describe('JwtStrategy.validate DB context', () => {
  const user = { id: '22222222-2222-2222-2222-222222222222', isPlatformAdmin: false };
  const authService = { validateOidcPayload: jest.fn().mockResolvedValue(user) };
  const strategy = new JwtStrategy(authService as any);

  it('binds the verified user id to the request DB context for RLS', async () => {
    const context: DatabaseContext = {};
    await dbContextStorage.run(context, () => strategy.validate({ sub: 'subject-1' } as any));
    expect(context.userId).toBe(user.id);
    expect(context.isAdmin).toBeUndefined();
    expect(context.tenantId).toBeUndefined();
  });

  it('does not overwrite a user id already set by an earlier guard', async () => {
    const context: DatabaseContext = { userId: '33333333-3333-3333-3333-333333333333' };
    await dbContextStorage.run(context, () => strategy.validate({ sub: 'subject-1' } as any));
    expect(context.userId).toBe('33333333-3333-3333-3333-333333333333');
  });
});
