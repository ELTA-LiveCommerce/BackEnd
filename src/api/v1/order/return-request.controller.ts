import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { CreateReturnRequestDto } from '@/module/order/dto/create-return-request.dto';
import { ReturnRequest } from '@/module/order/entity/return-request.entity';
import { ReturnRequestService } from '@/module/order/return-request.service';
import { AuthenticatedRequest } from '@/shared/common/interfaces/authenticated-request.interface';

@Controller('v1/returns')
export class ReturnRequestController {
  constructor(private readonly returnRequestService: ReturnRequestService) {}

  /**
   * 새로운 반품 요청 생성
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createReturnRequestDto: CreateReturnRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReturnRequest> {
    return this.returnRequestService.create(createReturnRequestDto, req.user.id);
  }

  /**
   * 현재 로그인한 사용자의 반품 요청 목록 조회
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: AuthenticatedRequest): Promise<ReturnRequest[]> {
    return this.returnRequestService.findByUserId(req.user.id);
  }

  /**
   * 특정 반품 요청 상세 조회
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest): Promise<ReturnRequest> {
    return this.returnRequestService.findOne(id, req.user.id);
  }
}
