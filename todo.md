# ELTA 백엔드 장바구니 기능 개발 TODO

## 1. 장바구니 엔티티 설계 및 구현

- [x] 장바구니(Cart) 엔티티 생성
  - [x] 사용자(User)와의 관계 설정
  - [x] 생성일, 수정일 필드 추가
- [x] 장바구니 아이템(CartItem) 엔티티 생성
  - [x] 장바구니(Cart)와의 관계 설정
  - [x] 상품(Product)과의 관계 설정
  - [x] 수량 필드 추가
  - [x] 생성일, 수정일 필드 추가

## 2. 장바구니 서비스 구현

- [x] CartService 클래스 생성
  - [x] 사용자의 장바구니 조회 기능
  - [x] 장바구니에 상품 추가 기능
  - [x] 장바구니 상품 수량 변경 기능
  - [x] 장바구니에서 상품 삭제 기능
  - [x] 장바구니 전체 비우기 기능
- [x] CartRepository 인터페이스 구현
  - [x] 사용자 ID로 장바구니 찾기 기능
  - [x] 장바구니-상품 조합으로 CartItem 찾기 기능

## 3. 장바구니 API 컨트롤러 구현

- [x] CartController 클래스 생성
  - [x] 사용자 장바구니 조회 API 엔드포인트 (GET)
  - [x] 장바구니에 상품 추가 API 엔드포인트 (POST)
  - [x] 장바구니 상품 수량 변경 API 엔드포인트 (PUT)
  - [x] 장바구니에서 상품 삭제 API 엔드포인트 (DELETE)
  - [x] 장바구니 전체 비우기 API 엔드포인트 (DELETE)

## 4. DTO 클래스 구현

- [x] 요청 DTO 클래스 생성
  - [x] AddToCartRequestDto (상품 ID, 수량)
  - [x] UpdateCartItemRequestDto (상품 ID, 수량)
- [x] 응답 DTO 클래스 생성
  - [x] CartResponseDto (장바구니 정보)
  - [x] CartItemResponseDto (장바구니 아이템 정보)

## 5. 유효성 검사 및 예외 처리

- [x] 상품 존재 여부 검사
- [x] 상품 재고 확인
- [x] 중복 상품 처리 로직 (기존 수량에 추가 또는 별도 항목)
- [x] 잘못된 수량 입력 처리 (음수, 0, 최대 주문 가능 수량 초과 등)

## 6. 테스트 코드 작성

- [x] 서비스 단위 테스트
  - [x] 장바구니 조회 테스트
  - [x] 상품 추가 테스트
  - [x] 상품 수량 변경 테스트
  - [x] 상품 삭제 테스트
  - [x] 장바구니 비우기 테스트
- [x] 컨트롤러 단위 테스트
  - [x] API 엔드포인트 테스트
  - [x] 인증 및 권한 테스트
- [x] 통합 테스트

## 7. 성능 최적화

- [x] N+1 쿼리 문제 해결
- [x] 적절한 인덱스 설정
- [-] 캐싱 고려 (캐싱 기능 제거)

---

# ELTA 백엔드 뷰어 배송 조회 API 개발 TODO

## 8. 뷰어 배송 조회 기능 구현

- [x] DeliveryService 배송 조회 메서드 구현
  - [x] findDeliveriesByOrderForViewer() 메서드 추가
  - [x] 주문 권한 확인 로직 구현
  - [x] 판매자별 배송 정보 그룹화 기능
  - [x] 관련 상품 정보 매핑 기능

## 9. 뷰어 배송 조회 API 컨트롤러 구현

- [x] OrderController에 배송 조회 엔드포인트 추가
  - [x] GET /:orderId/deliveries API 구현
  - [x] 사용자 인증 및 권한 검증
  - [x] DeliveryService 주입 및 호출
  - [x] 응답 DTO 변환 처리

## 10. 배송 조회 DTO 클래스 구현

- [x] 응답 DTO 클래스 생성
  - [x] OrderDeliveryItemResponseBody (주문 아이템 정보)
  - [x] OrderDeliverySellerResponseBody (판매자 정보)
  - [x] OrderDeliveryResponseBody (배송 정보)
  - [x] OrderDeliveryListResponseBody (배송 목록)
  - [x] OrderDeliveryListResponse (응답 래퍼)

## 11. 모듈 의존성 설정

- [x] OrderControllerModule 업데이트
  - [x] DeliveryModule import 추가
  - [x] 의존성 주입 설정 완료

## 12. 테스트 코드 작성

- [x] DeliveryService 단위 테스트
  - [x] 정상적인 배송 조회 테스트
  - [x] 주문 없음 예외 처리 테스트
  - [x] 권한 없음 예외 처리 테스트
  - [x] 빈 배송 목록 처리 테스트
- [x] OrderController 단위 테스트
  - [x] 배송 조회 API 엔드포인트 테스트
  - [x] 응답 형식 검증 테스트
- [x] E2E 통합 테스트
  - [x] 실제 API 호출 테스트
  - [x] 인증 토큰 검증 테스트
  - [x] 에러 상황 처리 테스트

## 13. API 문서화

- [x] Swagger 주석 추가
  - [x] @ApiOperation 메타데이터 설정
  - [x] @ApiParam 매개변수 문서화
  - [x] @ApiResponse 응답 형식 문서화
  - [x] DTO 클래스 @ApiProperty 추가

---

## 완료된 기능 요약

### ✅ 장바구니 기능 (완료)

- 장바구니 CRUD 기능
- 상품 추가/수정/삭제
- 유효성 검사 및 예외 처리
- 단위/통합 테스트

### ✅ 뷰어 배송 조회 기능 (완료)

- 주문별 배송 정보 조회
- 판매자별 배송 그룹화
- 권한 기반 접근 제어
- 완전한 테스트 커버리지

