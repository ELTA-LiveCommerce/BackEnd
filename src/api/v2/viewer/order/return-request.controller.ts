import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { GetUser } from '@/shared/common/decorators/get-user.decorator';
import { User } from '@/module/user/entity/user.entity';
import { ReturnRequestService } from '@/module/order/return-request.service';
import { CreateReturnRequestDto } from '@/module/order/dto/create-return-request.dto';
import { BaseResponseV2 } from '@/api/v2/common/base-response.dto';

import { CreateReturnRequestRequest, GetReturnRequestsQueryDto } from './return-request-request.dto';
import {
  ReturnRequestResponse,
  ReturnRequestListResponse,
  ReturnRequestResponseBody,
} from './return-request-response.dto';

@ApiTags('v2/viewer/returns')
@Controller('v2/viewer/returns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReturnRequestController {
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  /**
   * 새로운 반품 요청을 생성합니다.
   */
  @Post()
  @ApiOperation({ summary: '반품 요청 생성' })
  @ApiResponse({ status: 201, description: '반품 요청 생성 성공', type: ReturnRequestResponse })
  async create(
    @GetUser() user: User,
    @Body() createReturnRequestRequest: CreateReturnRequestRequest,
  ): Promise<ReturnRequestResponse> {
    // 요청 DTO 변환
    const createReturnRequestDto: CreateReturnRequestDto = {
      orderId: createReturnRequestRequest.orderId,
      reasonCategory: createReturnRequestRequest.reasonCategory,
      reasonDetail: createReturnRequestRequest.reasonDetail,
      pickupType: createReturnRequestRequest.pickupType,
      pickupNote: createReturnRequestRequest.pickupNote,
    };

    const result = await this.returnRequestService.create(createReturnRequestDto, user.id);

    const responseBody: ReturnRequestResponseBody = {
      id: result.id,
      orderId: result.order.id,
      reasonCategory: result.reasonCategory,
      reasonDetail: result.reasonDetail,
      status: result.status,
      pickupName: result.pickupName,
      pickupAddress: result.pickupAddress,
      pickupType: result.pickupType,
      pickupNote: result.pickupNote,
      requestedAt: result.requestedAt,
      refundedAt: result.refundedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return ReturnRequestResponse.fromReturnRequest(responseBody);
  }

  /**
   * 현재 로그인한 사용자의 반품 요청 목록을 조회합니다.
   */
  @Get()
  @ApiOperation({ summary: '내 반품 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '반품 요청 목록 조회 성공', type: ReturnRequestListResponse })
  async findAll(@Query() query: GetReturnRequestsQueryDto, @GetUser() user: User): Promise<ReturnRequestListResponse> {
    const returnRequests = await this.returnRequestService.findByUserId(user.id);

    const responseBody = returnRequests.map((request) => ({
      id: request.id,
      orderId: request.order.id,
      reasonCategory: request.reasonCategory,
      reasonDetail: request.reasonDetail,
      status: request.status,
      pickupName: request.pickupName,
      pickupAddress: request.pickupAddress,
      pickupType: request.pickupType,
      pickupNote: request.pickupNote,
      requestedAt: request.requestedAt,
      refundedAt: request.refundedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));

    return ReturnRequestListResponse.fromReturnRequests(responseBody);
  }

  /**
   * 특정 반품 요청 상세 정보를 조회합니다.
   */
  @Get(':id')
  @ApiOperation({ summary: '반품 요청 상세 조회' })
  @ApiParam({ name: 'id', description: '반품 요청 ID' })
  @ApiResponse({ status: 200, description: '반품 요청 상세 조회 성공', type: ReturnRequestResponse })
  async findOne(@Param('id') id: string, @GetUser() user: User): Promise<ReturnRequestResponse> {
    const returnRequest = await this.returnRequestService.findOne(id, user.id);

    const responseBody: ReturnRequestResponseBody = {
      id: returnRequest.id,
      orderId: returnRequest.order.id,
      reasonCategory: returnRequest.reasonCategory,
      reasonDetail: returnRequest.reasonDetail,
      status: returnRequest.status,
      pickupName: returnRequest.pickupName,
      pickupAddress: returnRequest.pickupAddress,
      pickupType: returnRequest.pickupType,
      pickupNote: returnRequest.pickupNote,
      requestedAt: returnRequest.requestedAt,
      refundedAt: returnRequest.refundedAt,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt,
    };

    return ReturnRequestResponse.fromReturnRequest(responseBody);
  }
}

