import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { GetWeatherDto } from './dto/weather.dto';

describe('WeatherController', () => {
  let controller: WeatherController;

  const mockWeatherService = {
    getCurrentWeather: jest.fn(),
    getWeatherForecast: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [{ provide: WeatherService, useValue: mockWeatherService }],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getCurrentWeather should call WeatherService', async () => {
    const dto: GetWeatherDto = { location: 'London' };
    mockWeatherService.getCurrentWeather.mockResolvedValue({
      location: 'London',
      resolvedAddress: 'London',
      timezone: 'UTC',
      days: [],
      currentConditions: { temp: 20 },
    });
    await controller.getCurrentWeather(dto);
    expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledWith(dto);
  });

  it('getWeatherForecast should call WeatherService', async () => {
    const dto: GetWeatherDto = { location: 'London' };
    mockWeatherService.getWeatherForecast.mockResolvedValue({
      location: 'London',
      resolvedAddress: 'London',
      timezone: 'UTC',
      days: [],
      currentConditions: { temp: 20 },
    });
    await controller.getWeatherForecast(dto);
    expect(mockWeatherService.getWeatherForecast).toHaveBeenCalledWith(dto);
  });

  it('propagetes errors from WeatherService', async () => {
    const dto: GetWeatherDto = { location: 'London' };
    const errorMessage = 'Error fetching weather data';
    mockWeatherService.getCurrentWeather.mockRejectedValue(new Error(errorMessage));
    await expect(controller.getCurrentWeather(dto)).rejects.toThrowError(errorMessage);
  });
});
