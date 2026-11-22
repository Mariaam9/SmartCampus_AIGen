
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from "class-validator";

export class RegisterResponsableDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @MaxLength(100)
  nom: string;

  @IsString()
  @MaxLength(100)
  prenom: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fonction?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  service?: string;
}
