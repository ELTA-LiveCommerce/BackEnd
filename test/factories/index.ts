import { v4 as uuidv4 } from 'uuid';

import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

// 테스트용 사용자 생성 팩토리
export function createUserFactory(overrides?: Partial<User>): User {
  const user = new User();
  user.id = overrides?.id || uuidv4();
  user.email = overrides?.email || `test-${uuidv4()}@example.com`;
  user.name = overrides?.name || '테스트 사용자';
  user.role = overrides?.role || UserRole.VIEWER;
  user.password = overrides?.password || 'TestPass1!';
  user.isVerified = overrides?.isVerified !== undefined ? overrides.isVerified : true;
  user.createdAt = overrides?.createdAt || new Date();
  user.updatedAt = overrides?.updatedAt || new Date();
  return user;
}

// 테스트용 상품 생성 팩토리
export function createProductFactory(overrides?: Partial<Product>): Product {
  const product = new Product();
  product.id = overrides?.id || uuidv4();
  product.name = overrides?.name || '테스트 상품';
  product.description = overrides?.description || '테스트 상품 설명';
  product.price = overrides?.price || 10000;
  product.stockQuantity = overrides?.stockQuantity || 100;
  if (overrides?.seller) {
    product.seller = overrides.seller;
  }
  product.createdAt = overrides?.createdAt || new Date();
  product.updatedAt = overrides?.updatedAt || new Date();
  return product;
}

// 테스트용 방송 생성 팩토리
export function createBroadcastFactory(overrides?: Partial<Broadcast>): Broadcast {
  const broadcast = new Broadcast();
  broadcast.id = overrides?.id || uuidv4();
  broadcast.title = overrides?.title || '테스트 방송';
  broadcast.description = overrides?.description || '테스트 방송 설명';
  broadcast.isLive = overrides?.isLive !== undefined ? overrides.isLive : false;
  broadcast.streamKey = overrides?.streamKey || `stream-${uuidv4()}`;
  if (overrides?.seller) {
    broadcast.seller = overrides.seller;
  }
  broadcast.createdAt = overrides?.createdAt || new Date();
  broadcast.updatedAt = overrides?.updatedAt || new Date();
  return broadcast;
}
