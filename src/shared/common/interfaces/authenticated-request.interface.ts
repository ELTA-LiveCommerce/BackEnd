import { Request } from 'express';

import { User } from '@/module/user/entity/user.entity'; // User 엔티티의 실제 경로로 수정 필요

export interface AuthenticatedRequest extends Request {
  user: User;
}
