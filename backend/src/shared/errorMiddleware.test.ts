import { errorHandler } from './errorMiddleware';

const createResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

describe('errorHandler', () => {
  const req: any = { method: 'GET', url: '/test' };
  const next = jest.fn();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps mongoose validation errors to 400', () => {
    const res = createResponse();

    errorHandler({ name: 'ValidationError', message: 'Invalid model' }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid model' }));
  });

  it('maps duplicate key errors to 409', () => {
    const res = createResponse();

    errorHandler({ code: 11000 }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Duplicate resource found' }));
  });

  it('uses provided status for standard errors', () => {
    const res = createResponse();

    errorHandler({ status: 418, message: 'Short and stout' }, req, res, next);

    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Short and stout' }));
  });
});
