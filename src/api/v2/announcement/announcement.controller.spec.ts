import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest'; // ts-jest의 createMock 사용

import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from '@/module/announcement/announcement.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementResponseDto,
  GetAnnouncementsQueryDto,
} from '@/module/announcement/dto/announcement.dto';
import { User as UserEntity } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';
import { JwtAuthGuard } from '@/module/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/module/auth/guards/roles.guard';
import { Announcement, AnnouncementTargetPlatform } from '@/module/announcement/entity/announcement.entity';

describe('AnnouncementController', () => {
  let controller: AnnouncementController;
  let service: DeepMocked<AnnouncementService>; // DeepMocked로 타입 안정성 확보

  const mockUser: UserEntity = {
    id: 'test-user-id',
    loginId: 'admin@example.com',
    name: 'Test Admin',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    isVerified: true,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    logins: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      getSnapshot: jest.fn().mockReturnValue([]),
    } as any,
    products: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      getSnapshot: jest.fn().mockReturnValue([]),
    } as any,
    userProfile: null,
    sentFollowRequests: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      getSnapshot: jest.fn().mockReturnValue([]),
    } as any,
    receivedFollowRequests: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      getSnapshot: jest.fn().mockReturnValue([]),
    } as any,
    followers: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      getSnapshot: jest.fn().mockReturnValue([]),
    } as any,
    following: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      getSnapshot: jest.fn().mockReturnValue([]),
    } as any,
    qas: { add: jest.fn(), remove: jest.fn(), contains: jest.fn(), getSnapshot: jest.fn().mockReturnValue([]) } as any,
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementController],
      providers: [
        {
          provide: AnnouncementService,
          useValue: createMock<AnnouncementService>(), // createMock으로 서비스 모킹
        },
      ],
    })
      // JwtAuthGuard와 RolesGuard를 전역적으로 모킹하거나, 컨트롤러/메서드 레벨에서 .overrideGuard() 사용
      // 여기서는 Guard가 항상 true를 반환하도록 간단히 모킹하는 예시
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnnouncementController>(AnnouncementController);
    service = module.get(AnnouncementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an announcement', async () => {
      const createDto: CreateAnnouncementDto = {
        title: 'New Announcement',
        imageUrl: 'url',
        startDate: new Date(),
        endDate: new Date(),
      };
      const expectedResult = new Announcement(createDto);
      service.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, mockUser);
      expect(service.create).toHaveBeenCalledWith(createDto, mockUser);
      expect(result).toEqual(AnnouncementResponseDto.fromEntity(expectedResult));
    });
  });

  describe('findAll', () => {
    it('should return an array of announcements and total count', async () => {
      const query: GetAnnouncementsQueryDto = { page: 1, limit: 10 };
      const announcements = [new Announcement({ title: 'Ann1' }), new Announcement({ title: 'Ann2' })];
      const total = 2;
      service.findAll.mockResolvedValue({ announcements, total });

      const result = await controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.announcements).toEqual(announcements.map((a) => AnnouncementResponseDto.fromEntity(a)));
      expect(result.total).toEqual(total);
    });
  });

  describe('findOne', () => {
    it('should return a single announcement', async () => {
      const id = 'some-id';
      const expectedResult = new Announcement({ id, title: 'Test Ann' });
      service.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(AnnouncementResponseDto.fromEntity(expectedResult));
    });
  });

  describe('update', () => {
    it('should update an announcement', async () => {
      const id = 'some-id';
      const updateDto: UpdateAnnouncementDto = { title: 'Updated Ann' };
      const expectedResult = new Announcement({ id, ...updateDto });
      service.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto, mockUser);
      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockUser);
      expect(result).toEqual(AnnouncementResponseDto.fromEntity(expectedResult));
    });
  });

  describe('remove', () => {
    it('should remove an announcement', async () => {
      const id = 'some-id';
      service.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockUser);
      expect(service.remove).toHaveBeenCalledWith(id, mockUser);
    });
  });
});
