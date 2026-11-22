
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from "class-validator";

export class RegisterCandidatDto {
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
}
