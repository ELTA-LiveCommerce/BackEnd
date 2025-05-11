import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder, FindOptions } from '@mikro-orm/core';

import { Announcement } from './entity/announcement.entity';
import { CreateAnnouncementDto, UpdateAnnouncementDto, GetAnnouncementsQueryDto } from './dto/announcement.dto';
import { User } from '@/module/user/entity/user.entity';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: EntityRepository<Announcement>,
    private readonly em: EntityManager,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, currentUser: User): Promise<Announcement> {
    const announcement = new Announcement(createAnnouncementDto);
    await this.announcementRepository.persistAndFlush(announcement);
    return announcement;
  }

  async findAll(queryDto: GetAnnouncementsQueryDto): Promise<{ announcements: Announcement[]; total: number }> {
    const { platform, activeOnly, page = 1, limit = 10 } = queryDto;

    const where: Record<string, any> = {};
    if (platform) {
      where.targetPlatform = platform;
    }
    if (activeOnly !== undefined) {
      where.isActive = activeOnly;
    }

    const options: FindOptions<Announcement> = {
      orderBy: { displayOrder: QueryOrder.ASC, startDate: QueryOrder.DESC },
      limit: limit,
      offset: (page - 1) * limit,
    };

    const [announcements, total] = await this.em.findAndCount(Announcement, where, options);

    return { announcements, total };
  }

  async findOne(id: string): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({ id });
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID "${id}" not found`);
    }
    return announcement;
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto, currentUser: User): Promise<Announcement> {
    const announcement = await this.findOne(id);
    this.announcementRepository.assign(announcement, updateAnnouncementDto);
    await this.announcementRepository.flush();
    return announcement;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const announcement = await this.findOne(id);
    await this.announcementRepository.removeAndFlush(announcement);
  }
}
