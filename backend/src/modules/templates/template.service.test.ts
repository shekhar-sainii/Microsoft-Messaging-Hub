import { templateService } from './template.service';
import { templateRepository } from './template.repository';

jest.mock('./template.repository', () => ({
  templateRepository: {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('TemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves templates with adaptive type by default', async () => {
    (templateRepository.create as jest.Mock).mockResolvedValue({ id: 'tpl-1' });

    await expect(templateService.saveTemplate('u1', 'Daily', { body: [] })).resolves.toEqual({ id: 'tpl-1' });
    expect(templateRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1',
      name: 'Daily',
      type: 'adaptive',
    }));
  });

  it('seeds system templates when the premium template is missing', async () => {
    (templateRepository.findByUserId as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'system-1' }])
      .mockResolvedValueOnce([{ id: 'user-1' }]);
    (templateRepository.findOne as jest.Mock).mockResolvedValue(null);
    (templateRepository.create as jest.Mock).mockResolvedValue({});

    const result = await templateService.listTemplates('u1');

    expect(templateRepository.create).toHaveBeenCalledTimes(5);
    expect(result).toEqual([{ id: 'system-1' }, { id: 'user-1' }]);
  });

  it('does not reseed when system templates already exist', async () => {
    (templateRepository.findByUserId as jest.Mock)
      .mockResolvedValueOnce([{ id: 'system-1' }])
      .mockResolvedValueOnce([{ id: 'user-1' }]);
    (templateRepository.findOne as jest.Mock).mockResolvedValue({ id: 'seeded' });

    const result = await templateService.listTemplates('u1');

    expect(templateRepository.create).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 'system-1' }, { id: 'user-1' }]);
  });

  it('updates and deletes only templates owned by the user', async () => {
    (templateRepository.update as jest.Mock).mockResolvedValue({ id: 'tpl-1' });
    (templateRepository.delete as jest.Mock).mockResolvedValue(true);

    await templateService.updateTemplate('u1', 'tpl-1', { name: 'Updated' });
    await templateService.deleteTemplate('u1', 'tpl-1');

    expect(templateRepository.update).toHaveBeenCalledWith({ _id: 'tpl-1', userId: 'u1' }, { name: 'Updated' });
    expect(templateRepository.delete).toHaveBeenCalledWith({ _id: 'tpl-1', userId: 'u1' });
  });
});
