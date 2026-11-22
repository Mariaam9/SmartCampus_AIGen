import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CatalogueService, CATALOGUE_RESOURCES, CatalogueResource } from './catalogue.service';
import { CatalogueDto, ListQueryDto, ProgrammeMatiereDto } from './dto/catalogue.dto';

@Controller('api')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  private resource(value: string): CatalogueResource {
    if (!(CATALOGUE_RESOURCES as readonly string[]).includes(value)) {
      throw new BadRequestException('Ressource catalogue inconnue.');
    }
    return value as CatalogueResource;
  }

  @Get('agent/catalogue')
  agentCatalogue() {
    return this.catalogue.agentCatalogue();
  }

  // Consultation publique : uniquement les ressources publiées et, pour les tarifs
  // et conditions d'admission, encore dans leur période de validité.
  @Get(':resource')
  list(@Param('resource') raw: string, @Query() query: ListQueryDto) {
    return this.catalogue.list(this.resource(raw), query, true);
  }
 // Consultation de gestion : inclut les brouillons et archives.
  // IMPORTANT : ces routes ne sont pas protégées tant qu'une authentification
  // et des Guards de rôles/établissement ne sont pas présents dans le projet.
  @Get('gestion/:resource')
  gestionList(@Param('resource') raw: string, @Query() query: ListQueryDto) {
    return this.catalogue.list(this.resource(raw), query, false);
  }

  @Get('gestion/:resource/:id')
  gestionGet(@Param('resource') raw: string, @Param('id', ParseIntPipe) id: number) {
    return this.catalogue.get(this.resource(raw), id, false);
  }
  @Get(':resource/:id')
  get(@Param('resource') raw: string, @Param('id', ParseIntPipe) id: number) {
    return this.catalogue.get(this.resource(raw), id, true);
  }



  @Post('gestion/:resource')
  create(@Param('resource') raw: string, @Body() body: CatalogueDto) {
    return this.catalogue.create(this.resource(raw), body);
  }

  @Patch('gestion/:resource/:id')
  update(@Param('resource') raw: string, @Param('id', ParseIntPipe) id: number, @Body() body: CatalogueDto) {
    return this.catalogue.update(this.resource(raw), id, body);
  }

  @Delete('gestion/:resource/:id')
  remove(@Param('resource') raw: string, @Param('id', ParseIntPipe) id: number) {
    return this.catalogue.remove(this.resource(raw), id);
  }

  @Get('programmes/:id/matieres')
  programmeMatieres(@Param('id', ParseIntPipe) id: number) {
    return this.catalogue.listProgrammeMatieres(id, true);
  }

  @Post('gestion/programmes/:id/matieres')
  linkMatiere(@Param('id', ParseIntPipe) id: number, @Body() body: ProgrammeMatiereDto) {
    return this.catalogue.linkMatiere(id, body);
  }

  @Delete('gestion/programmes/:id/matieres/:matiereId')
  unlinkMatiere(
    @Param('id', ParseIntPipe) id: number,
    @Param('matiereId', ParseIntPipe) matiereId: number,
  ) {
    return this.catalogue.unlinkMatiere(id, matiereId);
  }
}
