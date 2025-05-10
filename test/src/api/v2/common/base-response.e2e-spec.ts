import { INestApplication, HttpStatus, Controller, Get, Module, HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

// 테스트용 컨트롤러
@Controller('test-base-response')
class TestController {
  @Get('success')
  getSuccess() {
    return BaseResponseV2.success({ test: 'data' }, '성공 메시지', HttpStatus.OK);
  }

  @Get('error')
  getError() {
    throw new HttpException(BaseResponseV2.error('에러 메시지', HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
  }
}

// 테스트용 모듈
@Module({
  controllers: [TestController],
})
class TestModule {}

describe('BaseResponseV2 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('성공 응답은 정해진 형식을 따른다', async () => {
    const response = await request(app.getHttpServer()).get('/test-base-response/success').expect(HttpStatus.OK);

    // 응답의 구조 검증
    expect(response.body).toHaveProperty('statusCode');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('timestamp');

    // 값 검증
    expect(response.body.statusCode).toBe(HttpStatus.OK);
    expect(response.body.message).toBe('성공 메시지');
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({ test: 'data' });
  });

  it('에러 응답은 정해진 형식을 따른다', async () => {
    const response = await request(app.getHttpServer()).get('/test-base-response/error').expect(HttpStatus.BAD_REQUEST);

    // 응답의 구조 검증
    expect(response.body).toHaveProperty('statusCode');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('timestamp');

    // 값 검증
    expect(response.body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe('에러 메시지');
    expect(response.body.success).toBe(false);
    expect(response.body.data).toBeNull();
  });
});
