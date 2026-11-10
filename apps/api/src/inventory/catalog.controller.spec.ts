import { CatalogController } from './catalog.controller';

describe('CatalogController', () => {
  const prisma: any = {
    make: { findMany: jest.fn().mockResolvedValue([{ id: 'make-1', name: 'Toyota' }]) },
    carModel: { findMany: jest.fn().mockResolvedValue([{ id: 'model-1', name: 'Land Cruiser' }]) },
  };
  const controller = new CatalogController(prisma);

  it('lists makes by name with only public fields', async () => {
    await expect(controller.listMakes()).resolves.toEqual([{ id: 'make-1', name: 'Toyota' }]);
    expect(prisma.make.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });

  it('lists models only for the requested make', async () => {
    await expect(controller.listModels('make-1')).resolves.toEqual([{ id: 'model-1', name: 'Land Cruiser' }]);
    expect(prisma.carModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { makeId: 'make-1' } }),
    );
  });
});
