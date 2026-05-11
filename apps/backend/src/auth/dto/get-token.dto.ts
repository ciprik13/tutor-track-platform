import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum UserRoleDto {
  ADMIN = 'ADMIN',
  TUTOR = 'TUTOR',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export class GetTokenDto {
  @ApiProperty({
    description: 'Rolul pentru care se emite tokenul (lab only)',
    enum: UserRoleDto,
    example: 'TUTOR',
  })
  @IsEnum(UserRoleDto)
  role!: UserRoleDto;

  @ApiProperty({
    description: 'ID-ul userului',
    example: 'a1b2c3d4-0000-0000-0000-000000000000',
  })
  @IsString()
  sub!: string;

  @ApiProperty({ example: 'Ion Popescu' })
  @IsString()
  name!: string;
}