import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, QueryOrder } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

import { AnnouncementService } from './announcement.service';
import { Announcement } from './entity/announcement.entity';
import { AnnouncementTargetPlatform } from '@/shared/enum/announcement-target-platform.enum';
import { CreateAnnouncementDto, UpdateAnnouncementDto, GetAnnouncementsQueryDto } from './dto/announcement.dto';
import { User } from '@/module/user/entity/user.entity';
import { UserRole } from '@/shared/enum/user-role.enum';

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let announcementRepository: EntityRepository<Announcement>;
  let entityManager: EntityManager;

  const mockAnnouncementRepository = {
    create: jest.fn(),
    persistAndFlush: jest.fn(),
    findOne: jest.fn(),
    assign: jest.fn().mockImplementation((entity, dto) => Object.assign(entity, dto)),
    flush: jest.fn(),
    removeAndFlush: jest.fn(),
    // findAndCount는 EntityManager에서 호출되므로 여기서는 모킹하지 않음
  };

  const mockEntityManager = {
    findAndCount: jest.fn(),
    // 다른 EntityManager 메서드가 필요하면 추가
  };

  const mockUser = new User();
  mockUser.id = 'test-user-id';
  mockUser.role = UserRole.ADMIN;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: mockAnnouncementRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    announcementRepository = module.get<EntityRepository<Announcement>>(getRepositoryToken(Announcement));
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return an announcement', async () => {
      const createDto: CreateAnnouncementDto = {
        title: 'Test Title',
        imageUrl: 'http://example.com/image.png',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // tomorrow
      };
      const expectedAnnouncement = new Announcement(createDto);
      mockAnnouncementRepository.create.mockReturnValue(expectedAnnouncement); // create는 엔티티 인스턴스를 반환해야 함
      mockAnnouncementRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(createDto, mockUser);

      // Announcement 생성자 직접 호출로 변경했으므로, create 모킹 대신 persistAndFlush 호출 확인
      expect(mockAnnouncementRepository.persistAndFlush).toHaveBeenCalledWith(expect.any(Announcement));
      // expect(result).toEqual(expectedAnnouncement); // 실제로는 persistAndFlush 후의 객체를 반환하므로, 주요 속성 비교가 더 적절할 수 있음
      expect(result.title).toEqual(createDto.title);
    });
  });

  describe('findAll', () => {
    it('should return announcements and total count', async () => {
      const query: GetAnnouncementsQueryDto = { page: 1, limit: 10 };
      const mockAnnouncements = [new Announcement(), new Announcement()];
      const mockTotal = 2;
      mockEntityManager.findAndCount.mockResolvedValue([mockAnnouncements, mockTotal]);

      const result = await service.findAll(query);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Announcement,
        {},
        {
          orderBy: { displayOrder: QueryOrder.ASC, startDate: QueryOrder.DESC },
          limit: 10,
          offset: 0,
        },
      );
      expect(result.announcements).toEqual(mockAnnouncements);
      expect(result.total).toEqual(mockTotal);
    });

    it('should apply filters if provided', async () => {
      const query: GetAnnouncementsQueryDto = {
        platform: AnnouncementTargetPlatform.WEB,
        activeOnly: true,
        page: 1,
        limit: 5,
      };
      mockEntityManager.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(mockEntityManager.findAndCount).toHaveBeenCalledWith(
        Announcement,
        { targetPlatform: AnnouncementTargetPlatform.WEB, isActive: true },
        {
          orderBy: { displayOrder: QueryOrder.ASC, startDate: QueryOrder.DESC },
          limit: 5,
          offset: 0,
        },
      );
    });
  });

  describe('findOne', () => {
    it('should return an announcement if found', async () => {
      const announcementId = 'test-id';
      const expectedAnnouncement = new Announcement();
      mockAnnouncementRepository.findOne.mockResolvedValue(expectedAnnouncement);

      const result = await service.findOne(announcementId);
      expect(mockAnnouncementRepository.findOne).toHaveBeenCalledWith({ id: announcementId });
      expect(result).toEqual(expectedAnnouncement);
    });

    it('should throw NotFoundException if announcement not found', async () => {
      const announcementId = 'non-existent-id';
      mockAnnouncementRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(announcementId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the announcement', async () => {
      const announcementId = 'test-id';
      const updateDto: UpdateAnnouncementDto = { title: 'Updated Title' };
      const existingAnnouncement = new Announcement({
        title: 'Old Title',
        imageUrl: 'url',
        startDate: new Date(),
        endDate: new Date(),
      });

      mockAnnouncementRepository.findOne.mockResolvedValue(existingAnnouncement);

      const result = await service.update(announcementId, updateDto, mockUser);

      expect(mockAnnouncementRepository.findOne).toHaveBeenCalledWith({ id: announcementId });
      expect(mockAnnouncementRepository.assign).toHaveBeenCalledWith(existingAnnouncement, updateDto);
      expect(mockAnnouncementRepository.flush).toHaveBeenCalled();
      expect(result.title).toEqual(updateDto.title);
    });

    it('should throw NotFoundException if announcement to update is not found', async () => {
      const announcementId = 'non-existent-id';
      const updateDto: UpdateAnnouncementDto = { title: 'Updated Title' };
      mockAnnouncementRepository.findOne.mockResolvedValue(null);

      await expect(service.update(announcementId, updateDto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the announcement', async () => {
      const announcementId = 'test-id';
      const existingAnnouncement = new Announcement();
      mockAnnouncementRepository.findOne.mockResolvedValue(existingAnnouncement);
      mockAnnouncementRepository.removeAndFlush.mockResolvedValue(undefined);

      await service.remove(announcementId, mockUser);

      expect(mockAnnouncementRepository.findOne).toHaveBeenCalledWith({ id: announcementId });
      expect(mockAnnouncementRepository.removeAndFlush).toHaveBeenCalledWith(existingAnnouncement);
    });

    it('should throw NotFoundException if announcement to remove is not found', async () => {
      const announcementId = 'non-existent-id';
      mockAnnouncementRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(announcementId, mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});
