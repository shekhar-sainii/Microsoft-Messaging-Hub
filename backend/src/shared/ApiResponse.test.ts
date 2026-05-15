import { ApiResponse } from './ApiResponse';

const createResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

describe('ApiResponse', () => {
  it('sends a normalized success payload', () => {
    const res = createResponse();

    ApiResponse.success(res, { id: '1' }, 'Created', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Created',
      data: { id: '1' },
      timestamp: expect.any(String),
    }));
  });

  it('hides error objects outside development', () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = createResponse();

    ApiResponse.error(res, new Error('Nope'), 400);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Nope',
      error: undefined,
    }));

    process.env.NODE_ENV = previousEnv;
  });
});
