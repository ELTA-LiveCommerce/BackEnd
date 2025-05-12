import { BaseResponseV2, PagedResponseV2 } from '@/api/v2/common/base-response.dto';
import { Product } from '@/module/product/entity/product.entity';
import { User } from '@/module/user/entity/user.entity';

// 판매자 정보 (간략)
class ProductSellerInfo {
  id!: string;
  name!: string; // 또는 nickname
  // profileImage?: string;

  static fromUserEntity(seller: User): ProductSellerInfo {
    const info = new ProductSellerInfo();
    info.id = seller.id;
    info.name = seller.name; // User 엔티티에 nickname 필드가 있다면 그것을 우선적으로 사용
    return info;
  }
}

export class ViewerProductResponseBodyDto {
  id!: string;
  name!: string;
  shortDescription?: string;
  description!: string;
  price!: number;
  discountPrice?: number;
  stockQuantity!: number;
  mainImage?: string;
  images?: string[];
  seller!: ProductSellerInfo; // 간략한 판매자 정보
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(product: Product): ViewerProductResponseBodyDto {
    const dto = new ViewerProductResponseBodyDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.shortDescription = product.shortDescription;
    dto.description = product.description;
    dto.price = product.price;
    dto.discountPrice = product.discountPrice;
    dto.stockQuantity = product.stockQuantity;
    dto.mainImage = product.mainImage;
    dto.images = product.images;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;

    // 판매자 정보 채우기 (product.seller가 User 엔티티 인스턴스라고 가정)
    if (product.seller instanceof User) {
      // 타입 가드
      dto.seller = ProductSellerInfo.fromUserEntity(product.seller);
    } else if (
      product.seller &&
      typeof product.seller === 'object' &&
      'id' in product.seller &&
      'name' in product.seller
    ) {
      // product.seller가 populate되지 않고 ID만 있는 경우 또는 부분 객체인 경우 처리 (실제로는 서비스에서 User 엔티티를 로드해야 함)
      const tempSeller = new ProductSellerInfo();
      tempSeller.id = (product.seller as any).id;
      tempSeller.name = (product.seller as any).name || 'Unknown Seller'; // 안전하게 이름 처리
      dto.seller = tempSeller;
    }

    return dto;
  }
}

export class ViewerProductListResponseBodyDto {
  items: ViewerProductResponseBodyDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(items: ViewerProductResponseBodyDto[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

export class ViewerProductResponseDto extends BaseResponseV2<ViewerProductResponseBodyDto> {
  static success(data: ViewerProductResponseBodyDto, message = '상품 상세 정보입니다.'): ViewerProductResponseDto {
    return new ViewerProductResponseDto(data, 200, message, true);
  }
}

export class ViewerProductListResponseDto extends PagedResponseV2<ViewerProductResponseBodyDto> {
  /**
   * 페이지네이션된 성공 응답을 생성합니다.
   * @param items 항목 목록
   * @param total 전체 항목 수
   * @param page 현재 페이지
   * @param limit 페이지 당 항목 수
   * @param message 응답 메시지
   */
  static createPaged(
    items: ViewerProductResponseBodyDto[],
    total: number,
    page: number,
    limit: number,
    message = '상품 목록입니다.',
  ): ViewerProductListResponseDto {
    // PagedResponseV2.from<ViewerProductResponseBodyDto>을 사용하여 인스턴스 생성
    // 반환 타입을 ViewerProductListResponseDto로 캐스팅하는 것은
    // ViewerProductListResponseDto가 PagedResponseV2<ViewerProductResponseBodyDto>와 호환되기 때문입니다.
    // PagedResponseV2.from의 반환 타입은 PagedResponseV2<T>이므로 캐스팅이 필요할 수 있습니다.
    const response = PagedResponseV2.from<ViewerProductResponseBodyDto>(items, total, page, limit, message);
    // PagedResponseV2.from이 PagedResponseV2<T>를 반환하므로,
    // ViewerProductListResponseDto의 인스턴스로 만들기 위해서는 추가 작업이 필요하거나,
    // 이 클래스가 PagedResponseV2를 상속하는 의미를 다시 생각해봐야 합니다.
    // 여기서는 PagedResponseV2.from이 생성한 객체의 프로토타입을 ViewerProductListResponseDto로 설정하거나,
    // 필요한 속성들을 ViewerProductListResponseDto의 새 인스턴스로 복사하는 방법이 있습니다.
    // 하지만 가장 간단한 방법은 PagedResponseV2.from의 결과를 그대로 사용하는 것입니다.
    // 만약 ViewerProductListResponseDto에 추가적인 메서드나 속성이 없다면,
    // PagedResponseV2<ViewerProductResponseBodyDto> 타입을 직접 사용해도 됩니다.
    // 여기서는 일단 PagedResponseV2.from의 결과를 반환하고, 필요시 호출부에서 타입을 조정하도록 합니다.
    // 또는, ViewerProductListResponseDto가 PagedResponseV2를 확장하는 이유가 명확하다면,
    // 생성자를 통해 PagedResponseV2의 데이터를 받아 초기화하도록 수정할 수 있습니다.

    // 현재 PagedResponseV2.from은 PagedResponseV2<T>를 반환합니다.
    // ViewerProductListResponseDto는 PagedResponseV2<ViewerProductResponseBodyDto>를 확장하므로 호환됩니다.
    return response as ViewerProductListResponseDto;
  }
}
