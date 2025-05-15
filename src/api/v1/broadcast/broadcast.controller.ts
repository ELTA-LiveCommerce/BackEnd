import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 } from 'uuid';

import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { BroadcastService } from '@/module/broadcast/broadcast.service';
import { CreateBroadcastDto } from '@/module/broadcast/dto/create-broadcast.dto';
import { Broadcast } from '@/module/broadcast/entity/broadcast.entity';
import { AuthenticatedRequest } from '@/shared/common/interfaces/authenticated-request.interface';
import { Roles } from '@/shared/common/roles.decorator';
import { UserRole } from '@/shared/enum/user-role.enum';

// 파일 업로드 설정
const storage = diskStorage({
  destination: './uploads/broadcasts',
  filename: (req, file, cb) => {
    const uniqueName = `${v4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestException('이미지 파일만 업로드 가능합니다.'), false);
  }
};

@Controller('v1/broadcasts')
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.SELLER) // 판매자만 방송 생성 가능
  // @Post()
  // @UseInterceptors(
  //   FileInterceptor('thumbnailImage', {
  //     storage,
  //     fileFilter,
  //     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  //   }),
  // )
  // async create(
  //   @Body() createBroadcastDto: CreateBroadcastDto,
  //   @Request() req: AuthenticatedRequest,
  //   @UploadedFile() file?: Express.Multer.File,
  // ): Promise<Broadcast> {
  //   // 이미지 파일이 업로드된 경우 경로 설정
  //   if (file) {
  //     createBroadcastDto.thumbnailImage = `/uploads/broadcasts/${file.filename}`;
  //   }

  //   const seller = req.user;
  //   return this.broadcastService.create(createBroadcastDto, seller);
  // }

  @Get()
  async findAll(): Promise<Broadcast[]> {
    return this.broadcastService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Broadcast> {
    return this.broadcastService.findOne(id);
  }

  /**
   * 특정 셀러의 모든 방송 목록을 조회합니다.
   * @param sellerId 셀러 ID
   */
  @Get('seller/:sellerId')
  async findBySeller(@Param('sellerId') sellerId: string): Promise<Broadcast[]> {
    return this.broadcastService.findBySellerId(sellerId);
  }

  // TODO: Update, Delete 엔드포인트 추가
  // TODO: 방송 시작/종료, 상품 연동 등의 엔드포인트 추가
}
