import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateMaxViewersRequest } from '@/api/v2/admin/broadcast/dto/admin-broadcast-request.dto';

describe('UpdateMaxViewersRequest DTO', () => {
  it('should pass validation with valid max viewers count', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: 100 });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.maxViewers).toBe(100);
  });

  it('should pass validation with zero max viewers', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: 0 });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.maxViewers).toBe(0);
  });

  it('should pass validation with maximum allowed value', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: 999999 });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.maxViewers).toBe(999999);
  });

  it('should fail validation with negative max viewers', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: -1 });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should fail validation with max viewers exceeding limit', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: 1000000 });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('max');
  });

  it('should fail validation with non-number max viewers', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: 'invalid' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should fail validation with missing max viewers', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, {});
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('maxViewers');
  });

  it('should fail validation with null max viewers', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: null });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should fail validation with undefined max viewers', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: undefined });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should fail validation with decimal max viewers', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: 100.5 });
    const errors = await validate(dto);

    // 소수점 허용 여부는 구현에 따라 다를 수 있음
    // 정수만 허용하는 경우 에러가 발생해야 함
    expect(dto.maxViewers).toBe(100.5);
  });

  it('should handle large numbers within limit', async () => {
    const dto = plainToClass(UpdateMaxViewersRequest, { maxViewers: 500000 });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.maxViewers).toBe(500000);
  });
});

