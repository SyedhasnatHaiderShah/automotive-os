import { dbContextStorage, runWithDbContext } from './prisma.service';

describe('runWithDbContext', () => {
  it('runs a lazy thenable (like a PrismaPromise) inside the context', async () => {
    let seen: unknown = 'not-run';
    // PrismaPromise only executes when `.then` is called, like this object.
    const lazyQuery = {
      then(resolve: (v: string) => void) {
        seen = dbContextStorage.getStore();
        resolve('rows');
      },
    } as unknown as Promise<string>;

    const result = await runWithDbContext({ isAdmin: true }, () => lazyQuery);

    expect(result).toBe('rows');
    expect(seen).toEqual({ isAdmin: true });
  });

  it('does not leak the context after the call', async () => {
    await runWithDbContext({ tenantId: '11111111-1111-1111-1111-111111111111' }, async () => 'ok');
    expect(dbContextStorage.getStore()).toBeUndefined();
  });
});
