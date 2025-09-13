import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../redis/redis.service';
import { GetWeatherDto } from './dto/weather.dto';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('WeatherService', () => {
  let service: WeatherService;

  const mockConfig = { get: jest.fn() };
  const mockHttpService = { get: jest.fn() };
  const mockRedisService = { get: jest.fn(), set: jest.fn() };

  beforeEach(async () => {
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'weather.baseUrl') return 'https://api.test/weather';
      if (key === 'weather.apiKey') return 'TEST_KEY';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: HttpService, useValue: mockHttpService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns cached data when present', async () => {
    const dto: GetWeatherDto = { location: 'London' };
    const cached = {
      latitude: 51.5,
      longitude: -0.1,
      address: 'London',
      days: [],
      currentConditions: { temp: 20 },
    };

    mockRedisService.get.mockResolvedValue(JSON.stringify(cached));

    const res = await service.getCurrentWeather(dto);

    expect(res).toEqual(cached);
    expect(mockHttpService.get).not.toHaveBeenCalled();
  });

  it('fetches from API and caches when no cache present', async () => {
    const dto: GetWeatherDto = { location: 'London' };
    const apiResponse = {
      latitude: 51.5,
      longitude: -0.1,
      address: 'London',
      days: [],
      currentConditions: { temp: 21 },
    };

    mockRedisService.get.mockResolvedValue(null);
    mockHttpService.get.mockReturnValue(of({ data: apiResponse }));

    const res = await service.getCurrentWeather(dto);

    expect(res).toEqual(apiResponse);
    expect(mockHttpService.get).toHaveBeenCalled();
    expect(mockRedisService.set).toHaveBeenCalled();
  });

  it('maps API 401 error to HttpException', async () => {
    const dto: GetWeatherDto = { location: 'London' };

    mockRedisService.get.mockResolvedValue(null);
    mockHttpService.get.mockReturnValue(
      throwError(() => ({ response: { status: 401, data: {} } })),
    );

    await expect(service.getCurrentWeather(dto)).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
