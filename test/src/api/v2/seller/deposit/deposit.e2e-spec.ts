import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '@/app.module'; // Adjust path if needed
import { UserRole } from '@/shared/enum/user-role.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '@/module/order/entity/order.entity';

// Helper function to generate test token (assuming it exists or you create it)
// Adapt this based on your actual implementation
function generateTestToken(
  jwtService: JwtService,
  userId = 'test-seller-id',
  email = 'seller@example.com',
  role = UserRole.SELLER,
): string {
  return jwtService.sign({
    sub: userId,
    email,
    role,
    // Add other payload properties if necessary
  });
}

// Mock repositories or services if needed
const mockOrderRepository = {
  // Define mock methods if database interaction needs mocking for E2E
  // Often E2E tests run against a real test database
};

describe('DepositController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let sellerToken: string;
  let viewerToken: string; // For testing authorization

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Import main AppModule
    })
      //   .overrideProvider(getRepositoryToken(Order)) // Override if mocking DB
      //   .useValue(mockOrderRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get JwtService from the app instance
    jwtService = app.get(JwtService);
    sellerToken = generateTestToken(jwtService, 'seller-id', 'seller@test.com', UserRole.SELLER);
    viewerToken = generateTestToken(jwtService, 'viewer-id', 'viewer@test.com', UserRole.VIEWER);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v2/seller/deposits (GET)', () => {
    const depositsUrl = '/v2/seller/deposits';

    it('should return 401 Unauthorized if no token is provided', () => {
      return request(app.getHttpServer()).get(depositsUrl).expect(401);
    });

    it('should return 403 Forbidden if token is not for a SELLER', () => {
      return request(app.getHttpServer()).get(depositsUrl).set('Authorization', `Bearer ${viewerToken}`).expect(403);
    });

    it('should return 200 OK and the deposit list for the seller', async () => {
      // Optionally seed the test database with relevant orders first

      const response = await request(app.getHttpServer())
        .get(depositsUrl)
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      // Basic structure check
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.meta).toBeDefined();
      expect(response.body.data.meta.itemCount).toBeDefined();
      expect(response.body.data.meta.totalItems).toBeDefined();
      expect(response.body.data.meta.currentPage).toBe(1);
      expect(response.body.data.meta.itemsPerPage).toBe(5);

      // Add more specific checks based on seeded data if applicable
      // e.g., expect(response.body.data.items.length).toBeGreaterThan(0);
      // e.g., expect(response.body.data.items[0].productName).toEqual('Expected Product Name');
    });

    it('should handle pagination parameters correctly', async () => {
      const page = 2;
      const limit = 3;
      const response = await request(app.getHttpServer())
        .get(depositsUrl)
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ page, limit })
        .expect(200);

      expect(response.body.data.meta.currentPage).toBe(page);
      expect(response.body.data.meta.itemsPerPage).toBe(limit);
      // Optionally check item count based on limit
      // expect(response.body.data.items.length).toBeLessThanOrEqual(limit);
    });

    // Add tests for invalid query parameters if validation is implemented
    // it('should return 400 Bad Request for invalid page number', async () => { ... });
  });
});
