import { Test, TestingModule } from '@nestjs/testing';
import { RootController } from './root.controller';

describe('RootController', () => {
  let controller: RootController;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [RootController],
    }).compile();

    controller = testingModule.get<RootController>(RootController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoot', () => {
    it('should return "App is running!"', () => {
      const result = controller.getRoot();
      expect(result).toBe('App is running!');
    });

    it('should be mapped to GET /', () => {
      const path = Reflect.getMetadata('path', controller.getRoot);
      const method = Reflect.getMetadata('method', controller.getRoot);

      // method 0 is RequestMethod.GET in NestJS
      expect(path).toBe('/');
      expect(method).toBe(0);
    });
  });
});
