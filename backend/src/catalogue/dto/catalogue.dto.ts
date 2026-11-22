import { Type } from 'class-transformer';
import {
  IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString,
  Min, MinLength, MaxLength,
} from 'class-validator';

export class ListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit = 20;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) etablissementId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) formationId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) specialiteId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) programmeId?: number;
  @IsOptional() @IsString() niveau?: string;
  @IsOptional() @IsIn(['BROUILLON', 'PUBLIE', 'ARCHIVE']) statut?: 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
}

// DTO commun : seuls les champs explicitement déclarés sont acceptés par ValidationPipe.
export class CatalogueDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) etablissementId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) formationId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) specialiteId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) programmeId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) matiereId?: number;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(180) nom?: string;
  @IsOptional() @IsString() @MaxLength(80) code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() niveau?: string;
  @IsOptional() @IsString() duree?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) annee?: number;
  @IsOptional() @IsString() @MinLength(1) libelle?: string;
  @IsOptional() @IsString() modalitesPaiement?: string;
  @IsOptional() @IsIn(['BROUILLON', 'PUBLIE', 'ARCHIVE']) statutPublication?: 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
  @IsOptional() @IsIn(['BROUILLON', 'PUBLIE', 'ARCHIVE']) statut?: 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
  @IsOptional() @IsDateString() dateDebutValidite?: string;
  @IsOptional() @IsDateString() dateFinValidite?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) credits?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) montant?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) semestre?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) coefficient?: number;
}

export class ProgrammeMatiereDto {
  @Type(() => Number) @IsInt() @Min(1) matiereId!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) semestre?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) coefficient?: number;
}
