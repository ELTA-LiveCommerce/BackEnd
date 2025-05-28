import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcrypt';
import { v4 } from 'uuid';

import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

/**
 * 기본 판매자(Seller) 계정을 생성하는 시더
 * 프로덕션 환경에서도 안전하게 사용할 수 있도록 설계됨
 */
export class SellerSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const sellerLoginId = process.env.SELLER_LOGIN_ID || 'seller@elta.com';
    const sellerPassword = process.env.SELLER_PASSWORD || 'EltaSeller123!@#';
    const sellerName = process.env.SELLER_NAME || 'ELTA 기본 판매자';
    const sellerPhoneNumber = process.env.SELLER_PHONE_NUMBER || '010-1234-5678';
    const sellerBankName = process.env.SELLER_BANK_NAME || '국민은행';
    const sellerBankAccount = process.env.SELLER_BANK_ACCOUNT || '123-456-789012';
    const sellerAccountNumber = process.env.SELLER_ACCOUNT_NUMBER || '123456789012';

    // 이미 seller 계정이 존재하는지 확인
    const existingSeller = await em.findOne(User, {
      loginId: sellerLoginId,
      role: UserRole.SELLER,
    });

    if (existingSeller) {
      console.log(`Seller 계정이 이미 존재합니다: ${sellerLoginId}`);
      return;
    }

    // 비밀번호 해싱
    const saltRounds = 12; // 프로덕션 환경에서는 더 높은 salt rounds 사용
    const hashedPassword = await bcrypt.hash(sellerPassword, saltRounds);

    // Seller 계정 생성
    const sellerUser = em.create(User, {
      id: v4(),
      loginId: sellerLoginId,
      password: hashedPassword,
      name: sellerName,
      phoneNumber: sellerPhoneNumber,
      bankName: sellerBankName,
      bankAccount: sellerBankAccount,
      accountNumber: sellerAccountNumber,
      role: UserRole.SELLER,
      isVerified: true,
      feePercentage: 0.1, // 기본 수수료 10%
      createdAt: new Date(),
      updatedAt: new Date(),
      logins: [],
      following: [],
      followers: [],
      blockedUsersByMe: [],
      blockingSellersOfMe: [],
    });

    await em.persistAndFlush(sellerUser);

    console.log(`Seller 계정이 성공적으로 생성되었습니다:`);
    console.log(`- Login ID: ${sellerLoginId}`);
    console.log(`- Name: ${sellerName}`);
    console.log(`- Phone: ${sellerPhoneNumber}`);
    console.log(`- Bank: ${sellerBankName} (${sellerBankAccount})`);
    console.log(`- Role: ${UserRole.SELLER}`);
    console.log(`- Fee Percentage: 10%`);

    // 보안상 비밀번호는 로그에 출력하지 않음
    if (process.env.NODE_ENV !== 'production') {
      console.log(`- Password: ${sellerPassword} (개발 환경에서만 표시)`);
    }
  }
}

