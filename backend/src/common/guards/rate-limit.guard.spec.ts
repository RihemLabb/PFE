import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

const TEST_HANDLER = () => undefined;
class TestController {}

describe('RateLimitGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RateLimitGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new RateLimitGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createContext(ip = '127.0.0.1') {
    const response = {
      setHeader: jest.fn(),
    };
    const request = {
      ip,
      method: 'POST',
      originalUrl: '/auth/login?source=test',
      socket: {},
    };

    const context = {
      getHandler: () => TEST_HANDLER,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    return { context, response };
  }

  it('does nothing when a route has no rate-limit metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const { context } = createContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks requests after the configured limit', () => {
    reflector.getAllAndOverride.mockReturnValue({
      limit: 2,
      windowMs: 60_000,
    });
    const { context, response } = createContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);

    try {
      guard.canActivate(context);
      fail('Expected the third request to be rate limited');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }

    expect(response.setHeader).toHaveBeenCalledWith(
      'Retry-After',
      expect.any(String),
    );
  });

  it('tracks different client IPs independently', () => {
    reflector.getAllAndOverride.mockReturnValue({
      limit: 1,
      windowMs: 60_000,
    });
    const first = createContext('10.0.0.1');
    const second = createContext('10.0.0.2');

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(second.context)).toBe(true);
    expect(() => guard.canActivate(first.context)).toThrow(HttpException);
  });

  it('allows requests again after the window expires', () => {
    reflector.getAllAndOverride.mockReturnValue({
      limit: 1,
      windowMs: 1_000,
    });
    const nowSpy = jest.spyOn(Date, 'now');
    const { context } = createContext();

    nowSpy.mockReturnValue(1_000);
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);

    nowSpy.mockReturnValue(2_001);
    expect(guard.canActivate(context)).toBe(true);
  });
});
