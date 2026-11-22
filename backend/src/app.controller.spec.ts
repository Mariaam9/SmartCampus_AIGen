import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  const appServiceMock = {
    getData: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("testDatabase", () => {
    it("should return establishment data from AppService", async () => {
      const result = await appController.testDatabase();

      expect(result).toEqual([]);
      expect(appServiceMock.getData).toHaveBeenCalledTimes(1);
    });
  });
});
