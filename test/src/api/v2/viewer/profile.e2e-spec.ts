import { INestApplication } from '@nestjs/common';
import { createE2ETestingModule, mockViewer, testRequest } from '@test/helpers/e2e-test-utils';
import * as request from 'supertest';

import { ProfileController } from '@/api/v2/viewer/profile/profile.controller';
import { UserService } from '@/module/user/user.service';

describe('Profile Controller (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let deliveryAddressId: string = '67890-mock-address-id';

  // 모의 배송지 데이터
  const mockDeliveryAddress = {
    id: deliveryAddressId,
    receiverName: '테스트 수령인',
    address: '서울특별시 강남구 테스트로 123',
    addressDetail: '456호',
    postalCode: '12345',
    phoneNumber: '010-1234-5678',
    isDefault: true,
    userId: mockViewer.id,
  };

  // profile.e2e-spec.ts 에서 사용할 mockUserService 정의
  const mockUserService = {
    findOne: jest.fn().mockImplementation((id) => {
      if (id === mockViewer.id) {
        return Promise.resolve({
          ...mockViewer,
          phoneNumber: '010-1234-5678',
          accountNumber: '123-456-789',
          bankName: 'Test Bank',
        });
      }
      return Promise.resolve(null);
    }),
    updateProfile: jest.fn().mockImplementation((id, data) => {
      return Promise.resolve({ ...mockViewer, ...data });
    }),
    updateBankInfo: jest.fn().mockImplementation((id, data) => {
      return Promise.resolve({ ...mockViewer, ...data });
    }),
    // 배송지 관련 메소드는 ProfileController에서 UserService를 직접 호출하지 않으므로,
    // UserService 모킹에는 포함하지 않아도 됩니다.
    // 만약 ProfileController가 UserService의 배송지 관련 메소드를 호출한다면 여기에 추가해야 합니다.
    getDeliveryAddresses: jest.fn().mockResolvedValue([
      {
        id: 'mock-address-id-1',
        address: 'Test Address 1',
        detailAddress: 'Detail 1',
        postalCode: '11111',
        receiverName: 'Receiver 1',
        receiverPhone: '010-1111-1111',
        isDefault: true,
      },
    ]),
    addDeliveryAddress: jest.fn().mockImplementation((userId, addressData) => {
      return Promise.resolve({ id: 'new-mock-address-id', ...addressData });
    }),
    updateDeliveryAddress: jest.fn().mockImplementation((userId, addressId, addressData) => {
      return Promise.resolve({ id: addressId, ...addressData });
    }),
    deleteDeliveryAddress: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
    try {
      // E2E 테스트 모듈 생성
      const { app: testApp, authToken: testToken } = await createE2ETestingModule({
        controllers: [ProfileController],
        providers: [
          {
            provide: UserService,
            useValue: mockUserService,
          },
        ],
        mockUser: mockViewer,
      });

      app = testApp;
      authToken = testToken;
    } catch (error) {
      console.error('테스트 설정 중 오류 발생:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // 프로필 조회 테스트
  describe('GET /v2/viewer/profile', () => {
    it('인증된 사용자는 프로필 정보를 조회할 수 있다', async () => {
      const response = await testRequest(app, authToken).get('/v2/viewer/profile').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBeDefined();
      expect(response.body.data.name).toBeDefined();
    });

    it('인증되지 않은 사용자는 프로필을 조회할 수 없다', async () => {
      const response = await request(app.getHttpServer()).get('/v2/viewer/profile').expect(403);

      expect(response.body.statusCode).toBe(403);
      expect(response.body.message).toBe('Forbidden resource');
    });
  });

  // 프로필 수정 테스트
  describe('PUT /v2/viewer/profile', () => {
    it('인증된 사용자는 프로필 정보를 수정할 수 있다', async () => {
      const updateData = {
        name: '수정된 프로필 이름',
        phoneNumber: '010-1234-5678',
      };

      const response = await testRequest(app, authToken).put('/v2/viewer/profile').send(updateData).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(updateData.name);
    });
  });

  // 배송지 관리 API 테스트
  describe('배송지 관리 API', () => {
    it('배송지 목록을 조회할 수 있다', async () => {
      const response = await testRequest(app, authToken).get('/v2/viewer/profile/delivery-addresses').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('새 배송지를 추가할 수 있다', async () => {
      const newAddressData = {
        receiverName: '테스트 수령인',
        address: '서울특별시 강남구 테스트로 123',
        addressDetail: '456호',
        postalCode: '12345',
        phoneNumber: '010-1234-5678',
        isDefault: true,
      };

      const response = await testRequest(app, authToken)
        .post('/v2/viewer/profile/delivery-addresses')
        .send(newAddressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();

      deliveryAddressId = response.body.data.id;
    });

    it('배송지를 수정할 수 있다', async () => {
      const updateData = {
        receiverName: '수정된 수령인',
        address: '서울특별시 서초구 수정로 456',
        addressDetail: '789호',
        postalCode: '54321',
        phoneNumber: '010-8765-4321',
        isDefault: true,
      };

      const response = await testRequest(app, authToken)
        .put(`/v2/viewer/profile/delivery-addresses/${deliveryAddressId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.receiverName).toBe(updateData.receiverName);
    });

    it('배송지를 삭제할 수 있다', async () => {
      const response = await testRequest(app, authToken)
        .delete(`/v2/viewer/profile/delivery-addresses/${deliveryAddressId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
