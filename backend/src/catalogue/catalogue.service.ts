
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  CatalogueDto,
  ListQueryDto,
  ProgrammeMatiereDto,
} from './dto/catalogue.dto.js';

export const CATALOGUE_RESOURCES = [
  'formations',
  'specialites',
  'programmes',
  'matieres',
  'conditions-admission',
  'prerequis',
  'tarifs',
] as const;

export type CatalogueResource = (typeof CATALOGUE_RESOURCES)[number];

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(resource: CatalogueResource): any {
    const map: Record<CatalogueResource, any> = {
      formations: this.prisma.formation,
      specialites: this.prisma.specialite,
      programmes: this.prisma.programme,
      matieres: this.prisma.matiere,
      'conditions-admission': this.prisma.conditionAdmission,
      prerequis: this.prisma.prerequis,
      tarifs: this.prisma.tarif,
    };

    return map[resource];
  }

  private publicFilter(resource: CatalogueResource): Record<string, any> {
    const now = new Date();

    if (resource === 'formations') {
      return { statut: 'PUBLIE' };
    }

    if (resource === 'specialites') {
      return { formation: { statut: 'PUBLIE' } };
    }

    if (resource === 'programmes') {
      return {
        specialite: {
          formation: {
            statut: 'PUBLIE',
          },
        },
      };
    }

    if (resource === 'matieres') {
      return {
        programmeMatieres: {
          some: {
            programme: {
              specialite: {
                formation: {
                  statut: 'PUBLIE',
                },
              },
            },
          },
        },
      };
    }

    if (resource === 'prerequis') {
      return { formation: { statut: 'PUBLIE' } };
    }

    return {
      statutPublication: 'PUBLIE',
      formation: { statut: 'PUBLIE' },
      AND: [
        {
          OR: [
            { dateDebutValidite: null },
            { dateDebutValidite: { lte: now } },
          ],
        },
        {
          OR: [
            { dateFinValidite: null },
            { dateFinValidite: { gte: now } },
          ],
        },
      ],
    };
  }

  private include(resource: CatalogueResource): Record<string, any> {
    const map: Record<CatalogueResource, Record<string, any>> = {
      formations: {
        etablissement: {
          select: { id: true, code: true, nom: true },
        },
      },

      specialites: {
        formation: {
          select: {
            id: true,
            nom: true,
            niveau: true,
            etablissementId: true,
          },
        },
      },

      programmes: {
        specialite: {
          include: {
            formation: {
              select: {
                id: true,
                nom: true,
                etablissementId: true,
              },
            },
          },
        },
      },

      matieres: {
        programmeMatieres: {
          include: {
            programme: {
              select: { id: true, nom: true },
            },
          },
        },
      },

      'conditions-admission': {
        formation: {
          select: {
            id: true,
            nom: true,
            etablissementId: true,
          },
        },
      },

      prerequis: {
        formation: {
          select: {
            id: true,
            nom: true,
            etablissementId: true,
          },
        },
      },

      tarifs: {
        formation: {
          select: {
            id: true,
            nom: true,
            etablissementId: true,
          },
        },
      },
    };

    return map[resource];
  }

  private buildWhere(
    resource: CatalogueResource,
    q: ListQueryDto,
    publicOnly: boolean,
  ) {
    const where: any = publicOnly ? this.publicFilter(resource) : {};

    if (q.etablissementId) {
      if (resource === 'formations') {
        where.etablissementId = q.etablissementId;
      } else if (
        resource === 'specialites' ||
        resource === 'prerequis' ||
        resource === 'conditions-admission' ||
        resource === 'tarifs'
      ) {
        where.formation = {
          ...(where.formation ?? {}),
          etablissementId: q.etablissementId,
        };
      } else if (resource === 'programmes') {
        where.specialite = {
          ...(where.specialite ?? {}),
          formation: {
            ...(where.specialite?.formation ?? {}),
            etablissementId: q.etablissementId,
          },
        };
      }
    }

    // Les filtres des matières sont combinés dans le même "some"
    // afin de conserver le filtre public et de ne pas écraser
    // les conditions déjà présentes.
    if (
      resource === 'matieres' &&
      (q.etablissementId || q.programmeId)
    ) {
      const existingSome = where.programmeMatieres?.some ?? {};
      const existingProgramme = existingSome.programme ?? {};
      const existingSpecialite = existingProgramme.specialite ?? {};
      const existingFormation = existingSpecialite.formation ?? {};

      where.programmeMatieres = {
        some: {
          ...existingSome,

          ...(q.programmeId
            ? { programmeId: q.programmeId }
            : {}),

          ...(q.etablissementId
            ? {
                programme: {
                  ...existingProgramme,
                  specialite: {
                    ...existingSpecialite,
                    formation: {
                      ...existingFormation,
                      etablissementId: q.etablissementId,
                    },
                  },
                },
              }
            : {}),
        },
      };
    }

    if (
      q.formationId &&
      [
        'specialites',
        'prerequis',
        'conditions-admission',
        'tarifs',
      ].includes(resource)
    ) {
      where.formationId = q.formationId;
    }

    if (q.specialiteId && resource === 'programmes') {
      where.specialiteId = q.specialiteId;
    }

    if (q.niveau && resource === 'formations') {
      where.niveau = q.niveau;
    }

    if (!publicOnly && q.statut && resource === 'formations') {
      where.statut = q.statut;
    }

    if (
      !publicOnly &&
      q.statut &&
      ['tarifs', 'conditions-admission'].includes(resource)
    ) {
      where.statutPublication = q.statut;
    }

    if (q.search?.trim()) {
      const field =
        resource === 'tarifs'
          ? 'libelle'
          : resource === 'conditions-admission' ||
              resource === 'prerequis'
            ? 'description'
            : 'nom';

      where[field] = {
        contains: q.search.trim(),
        mode: 'insensitive',
      };
    }

    return where;
  }

  async list(
    resource: CatalogueResource,
    query: ListQueryDto,
    publicOnly = false,
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));

    const where = this.buildWhere(resource, query, publicOnly);

    const allowedSort = [
      'id',
      'nom',
      'code',
      'niveau',
      'annee',
      'montant',
      'libelle',
      'createdAt',
    ];

    const sortBy = allowedSort.includes(query.sortBy || '')
      ? query.sortBy!
      : 'id';

    const [data, total] = await Promise.all([
      this.delegate(resource).findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: query.order === 'desc' ? 'desc' : 'asc',
        },
        include: this.include(resource),
      }),

      this.delegate(resource).count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async get(
    resource: CatalogueResource,
    id: number,
    publicOnly = false,
  ) {
    const where = publicOnly
      ? { id, ...this.publicFilter(resource) }
      : { id };

    const result = await this.delegate(resource).findFirst({
      where,
      include: this.include(resource),
    });

    if (!result) {
      throw new NotFoundException(
        'Ressource introuvable ou non publiée.',
      );
    }

    return result;
  }

  private dataFor(
    resource: CatalogueResource,
    dto: CatalogueDto,
    isCreate = false,
  ): Record<string, any> {
    const fields: Record<CatalogueResource, string[]> = {
      formations: [
        'etablissementId',
        'nom',
        'description',
        'niveau',
        'duree',
        'statut',
      ],

      specialites: [
        'formationId',
        'nom',
        'description',
      ],

      programmes: [
        'specialiteId',
        'nom',
        'description',
        'annee',
      ],

      matieres: [
        'code',
        'nom',
        'description',
        'credits',
      ],

      'conditions-admission': [
        'formationId',
        'description',
        'statutPublication',
        'dateDebutValidite',
        'dateFinValidite',
      ],

      prerequis: [
        'formationId',
        'description',
        'niveau',
      ],

      tarifs: [
        'formationId',
        'libelle',
        'montant',
        'modalitesPaiement',
        'statutPublication',
        'dateDebutValidite',
        'dateFinValidite',
      ],
    };

    const data: Record<string, any> = {};

    for (const field of fields[resource]) {
      if ((dto as any)[field] !== undefined) {
        data[field] = (dto as any)[field];
      }
    }

    for (const field of ['dateDebutValidite', 'dateFinValidite']) {
      if (data[field]) {
        data[field] = new Date(data[field]);
      }
    }

    // Les statuts par défaut sont appliqués uniquement à la création.
    // Lors d'un PATCH, le statut existant reste inchangé si le DTO ne le contient pas.
    if (
      isCreate &&
      resource === 'formations' &&
      data.statut === undefined
    ) {
      data.statut = 'BROUILLON';
    }

    if (
      isCreate &&
      ['tarifs', 'conditions-admission'].includes(resource) &&
      data.statutPublication === undefined
    ) {
      data.statutPublication = 'BROUILLON';
    }

    return data;
  }

  private validate(
    resource: CatalogueResource,
    data: Record<string, any>,
    partial = false,
  ) {
    const required: Record<CatalogueResource, string[]> = {
      formations: ['etablissementId', 'nom'],
      specialites: ['formationId', 'nom'],
      programmes: ['specialiteId', 'nom'],
      matieres: ['code', 'nom'],
      'conditions-admission': ['formationId', 'description'],
      prerequis: ['formationId', 'description'],
      tarifs: ['formationId', 'libelle', 'montant'],
    };

    if (!partial) {
      for (const field of required[resource]) {
        if (
          data[field] === undefined ||
          data[field] === null ||
          data[field] === ''
        ) {
          throw new BadRequestException(
            `Le champ ${field} est obligatoire.`,
          );
        }
      }
    }

    if (
      resource === 'tarifs' &&
      data.montant !== undefined &&
      (!Number.isFinite(Number(data.montant)) ||
        Number(data.montant) < 0)
    ) {
      throw new BadRequestException(
        'Le montant doit être un nombre positif ou nul.',
      );
    }

    const start = data.dateDebutValidite
      ? new Date(data.dateDebutValidite).getTime()
      : undefined;

    const end = data.dateFinValidite
      ? new Date(data.dateFinValidite).getTime()
      : undefined;

    if (
      start !== undefined &&
      end !== undefined &&
      start > end
    ) {
      throw new BadRequestException(
        'La date de début doit précéder ou être égale à la date de fin.',
      );
    }
  }

  async create(resource: CatalogueResource, dto: CatalogueDto) {
    const data = this.dataFor(resource, dto, true);

    this.validate(resource, data);

    try {
      return await this.delegate(resource).create({
        data,
        include: this.include(resource),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(
    resource: CatalogueResource,
    id: number,
    dto: CatalogueDto,
  ) {
    // Pas de valeurs par défaut lors d'une modification partielle.
    const data = this.dataFor(resource, dto);

    // Les champs de validité n'existent que sur les tarifs
    // et les conditions d'admission.
    const dateAware =
      resource === 'tarifs' ||
      resource === 'conditions-admission';

    const existing = await this.delegate(resource).findUnique({
      where: { id },
      select: dateAware
        ? {
            dateDebutValidite: true,
            dateFinValidite: true,
          }
        : {
            id: true,
          },
    });

    if (!existing) {
      throw new NotFoundException('Ressource introuvable.');
    }

    this.validate(resource, { ...existing, ...data }, true);

    try {
      return await this.delegate(resource).update({
        where: { id },
        data,
        include: this.include(resource),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(resource: CatalogueResource, id: number) {
    await this.get(resource, id);

    try {
      await this.delegate(resource).delete({ where: { id } });

      return {
        message: 'Suppression effectuée.',
        id,
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async linkMatiere(
    programmeId: number,
    dto: ProgrammeMatiereDto,
  ) {
    const programme = await this.prisma.programme.findUnique({
      where: { id: programmeId },
    });

    if (!programme) {
      throw new NotFoundException('Programme introuvable.');
    }

    try {
      return await this.prisma.programmeMatiere.create({
        data: {
          programmeId,
          matiereId: dto.matiereId,
          semestre: dto.semestre,
          coefficient: dto.coefficient,
        },
        include: {
          matiere: true,
          programme: true,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async unlinkMatiere(
    programmeId: number,
    matiereId: number,
  ) {
    try {
      await this.prisma.programmeMatiere.delete({
        where: {
          programmeId_matiereId: {
            programmeId,
            matiereId,
          },
        },
      });

      return {
        message: 'Association supprimée.',
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async listProgrammeMatieres(
    programmeId: number,
    publicOnly = false,
  ) {
    if (publicOnly) {
      const programme = await this.prisma.programme.findFirst({
        where: {
          id: programmeId,
          specialite: {
            formation: {
              statut: 'PUBLIE',
            },
          },
        },
      });

      if (!programme) {
        throw new NotFoundException(
          'Programme introuvable ou non publié.',
        );
      }
    }

    return this.prisma.programmeMatiere.findMany({
      where: { programmeId },
      include: { matiere: true },
    });
  }

  async agentCatalogue() {
    const [formations, conditionsAdmission, tarifs] =
      await Promise.all([
        this.list('formations', { page: 1, limit: 100 }, true),
        this.list(
          'conditions-admission',
          { page: 1, limit: 100 },
          true,
        ),
        this.list('tarifs', { page: 1, limit: 100 }, true),
      ]);

    return {
      formations: formations.data,
      conditionsAdmission: conditionsAdmission.data,
      tarifs: tarifs.data,
      generatedAt: new Date().toISOString(),
    };
  }

  private handlePrismaError(error: any): never {
    if (error?.code === 'P2002') {
      throw new ConflictException(
        'Une donnée avec cette valeur existe déjà.',
      );
    }

    if (error?.code === 'P2003' || error?.code === 'P2025') {
      throw new BadRequestException(
        'Identifiant ou relation invalide. Vérifiez les données associées.',
      );
    }

    throw error;
  }
}
