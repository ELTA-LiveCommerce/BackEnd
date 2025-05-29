import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { v4 } from 'uuid';

import { Product, ProductStatus } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * 테스트용 상품들을 생성하는 시더
 * 기존에 생성된 판매자 계정을 사용하여 다양한 테스트 상품을 생성합니다.
 */
export class ProductSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // 기존 판매자 계정 찾기
    const seller = await em.findOne(User, {
      role: UserRole.SELLER,
      loginId: 'seller@elta.com',
    });

    if (!seller) {
      console.log('⚠️  판매자 계정이 없습니다. 먼저 SellerSeeder를 실행하세요: pnpm seed:seller');
      return;
    }

    // 이미 상품이 존재하는지 확인
    const existingProducts = await em.find(Product, { seller: seller });
    if (existingProducts.length > 0) {
      console.log(`✅ 판매자(${seller.name})의 상품이 이미 ${existingProducts.length}개 존재합니다.`);
      return;
    }

    // 테스트용 상품 데이터
    const testProducts = [
      {
        name: '카카오톡 알림 테스트 상품 1',
        shortDescription: '무통장입금 알림톡 테스트를 위한 첫 번째 상품',
        description:
          '이 상품을 주문하면 010-3342-2799 번호로 입금계좌 안내 카카오톡이 전송됩니다. 테스트 목적으로 만들어진 상품입니다.',
        price: 15000,
        stockQuantity: 100,
        status: ProductStatus.ONSALE,
        mainImage: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=테스트+상품+1',
        images: [
          'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=테스트+상품+1',
          'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=상세이미지+1',
        ],
      },
      {
        name: '카카오톡 알림 테스트 상품 2',
        shortDescription: '알림톡 기능 검증용 두 번째 상품',
        description:
          '무통장입금 주문 시 자동으로 입금계좌 정보가 담긴 카카오톡 알림이 발송되는 테스트 상품입니다. 가격이 다른 상품으로 금액별 테스트가 가능합니다.',
        price: 25000,
        stockQuantity: 50,
        status: ProductStatus.ONSALE,
        mainImage: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=테스트+상품+2',
        images: [
          'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=테스트+상품+2',
          'https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=상세이미지+2',
        ],
      },
      {
        name: '고가 상품 알림 테스트',
        shortDescription: '고액 주문에 대한 알림톡 테스트용',
        description: '높은 금액의 상품을 주문했을 때 알림톡이 제대로 전송되는지 확인하기 위한 테스트 상품입니다.',
        price: 100000,
        stockQuantity: 10,
        status: ProductStatus.ONSALE,
        mainImage: 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=고가+테스트+상품',
        images: ['https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=고가+테스트+상품'],
      },
      {
        name: '재고 부족 테스트 상품',
        shortDescription: '재고 부족 상황 테스트용',
        description: '재고가 적은 상품으로 재고 부족 시나리오를 테스트할 수 있습니다.',
        price: 5000,
        stockQuantity: 2,
        status: ProductStatus.ONSALE,
        mainImage: 'https://via.placeholder.com/400x400/F7DC6F/000000?text=재고부족+상품',
        images: ['https://via.placeholder.com/400x400/F7DC6F/000000?text=재고부족+상품'],
      },
      {
        name: '할인가 적용 테스트 상품',
        shortDescription: '할인가가 적용된 상품으로 알림톡 테스트',
        description:
          '정가와 할인가가 모두 설정된 상품입니다. 알림톡에서 최종 결제금액이 올바르게 표시되는지 확인할 수 있습니다.',
        price: 30000,
        discountPrice: 20000,
        stockQuantity: 30,
        status: ProductStatus.ONSALE,
        mainImage: 'https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=할인+상품',
        images: [
          'https://via.placeholder.com/400x400/E74C3C/FFFFFF?text=할인+상품',
          'https://via.placeholder.com/300x300/E74C3C/FFFFFF?text=할인+상세',
        ],
      },
    ];

    console.log(`🛍️  판매자 "${seller.name}"의 테스트 상품 생성 중...`);

    // 상품들 생성
    const products: Product[] = [];
    for (const productData of testProducts) {
      const product = em.create(Product, {
        id: v4(),
        name: productData.name,
        shortDescription: productData.shortDescription,
        description: productData.description,
        price: productData.price,
        discountPrice: productData.discountPrice,
        stockQuantity: productData.stockQuantity,
        status: productData.status,
        mainImage: productData.mainImage,
        images: productData.images,
        seller: seller,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      products.push(product);
    }

    await em.persistAndFlush(products);

    console.log(`✅ 테스트 상품 ${products.length}개가 성공적으로 생성되었습니다:`);
    products.forEach((product, index) => {
      console.log(
        `   ${index + 1}. ${product.name} (${product.price.toLocaleString()}원, 재고: ${product.stockQuantity}개)`,
      );
    });

    console.log('');
    console.log('💡 이제 다음 명령어로 카카오톡 알림 테스트를 진행할 수 있습니다:');
    console.log('   node test-kakaotalk-notification-detailed.js');
    console.log('   또는');
    console.log('   ./quick-test.sh');
  }
}
