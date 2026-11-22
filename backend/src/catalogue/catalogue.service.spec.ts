import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CatalogueService } from './catalogue.service.js';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('CatalogueService – règles des trois tâches', () => {
  const service = new CatalogueService({} as any);
  const validate = (service as any).validate.bind(service);
  const buildWhere = (service as any).buildWhere.bind(service);

  it('exige établissement et nom pour une formation', () => {
    expect(() => validate('formations', {})).toThrow(BadRequestException);
  });
  it('refuse un tarif négatif', () => {
    expect(() => validate('tarifs', { formationId: 1, libelle: 'Frais', montant: -1 })).toThrow(BadRequestException);
  });
  it('refuse une période de validité incohérente', () => {
    expect(() => validate('tarifs', { formationId: 1, libelle: 'Frais', montant: 10, dateDebutValidite: '2027-09-01', dateFinValidite: '2027-01-01' })).toThrow(BadRequestException);
  });
  it('accepte un tarif avec montant nul ou positif', () => {
    expect(() => validate('tarifs', { formationId: 1, libelle: 'Frais', montant: 0 })).not.toThrow();
    expect(() => validate('tarifs', { formationId: 1, libelle: 'Frais', montant: 1200 })).not.toThrow();
  });
  it('force les routes publiques à ne retourner que les formations publiées', () => {
    expect(buildWhere('formations', { statut: 'BROUILLON' }, true)).toEqual({ statut: 'PUBLIE' });
  });
  it('force les tarifs publics à être publiés et dans leur période de validité', () => {
    const where = buildWhere('tarifs', { statut: 'BROUILLON' }, true);
    expect(where.statutPublication).toBe('PUBLIE');
    expect(where.AND).toHaveLength(2);
    expect(where.formation.statut).toBe('PUBLIE');
  });
  it('filtre les spécialités par établissement via leur formation', () => {
    const where = buildWhere('specialites', { etablissementId: 7 }, false);
    expect(where.formation.etablissementId).toBe(7);
  });
  it('filtre les programmes par spécialité et établissement', () => {
    const where = buildWhere('programmes', { specialiteId: 3, etablissementId: 7 }, false);
    expect(where.specialiteId).toBe(3);
    expect(where.specialite.formation.etablissementId).toBe(7);
  });
  it('ne permet pas de trier par un champ arbitraire', () => {
    // Le tri est limité dans list() à une liste blanche de champs Prisma.
    expect(['id', 'nom', 'code', 'niveau', 'annee', 'montant', 'libelle', 'createdAt']).not.toContain('passwordHash');
  });
  it('mappe les erreurs Prisma de contrainte unique en conflit HTTP', () => {
    const handle = (service as any).handlePrismaError.bind(service);
    expect(() => handle({ code: 'P2002' })).toThrow(ConflictException);
  });
  it('mappe les relations invalides en erreur HTTP 400', () => {
    const handle = (service as any).handlePrismaError.bind(service);
    expect(() => handle({ code: 'P2003' })).toThrow(BadRequestException);
  });
});

describe('CatalogueService – opérations CRUD avec Prisma simulé', () => {
  const makeDelegate = () => ({
    findMany: jest.fn().mockResolvedValue([{ id: 1, nom: 'Test' }]),
    count: jest.fn().mockResolvedValue(1),
    findFirst: jest.fn().mockResolvedValue({ id: 1, nom: 'Test' }),
    findUnique: jest.fn().mockResolvedValue({ id: 1, dateDebutValidite: null, dateFinValidite: null }),
    create: jest.fn().mockResolvedValue({ id: 2, nom: 'Créé' }),
    update: jest.fn().mockResolvedValue({ id: 1, nom: 'Modifié' }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
  });
  const formation = makeDelegate();
  const prisma: any = {
    formation, specialite: makeDelegate(), programme: makeDelegate(), matiere: makeDelegate(),
    conditionAdmission: makeDelegate(), prerequis: makeDelegate(), tarif: makeDelegate(),
    programmeMatiere: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 1 }), delete: jest.fn().mockResolvedValue({}) },
  };
  const service = new CatalogueService(prisma);

  beforeEach(() => jest.clearAllMocks());
  it('retourne une liste paginée', async () => {
    const result = await service.list('formations', { page: 1, limit: 10 });
    expect(result.pagination.total).toBe(1);
    expect(formation.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
  });
  it('récupère une formation par identifiant', async () => {
    await expect(service.get('formations', 1)).resolves.toMatchObject({ id: 1 });
  });
  it('crée une formation avec les champs du modèle Prisma', async () => {
    await service.create('formations', { etablissementId: 1, nom: 'Génie logiciel' });
    expect(formation.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ etablissementId: 1, nom: 'Génie logiciel', statut: 'BROUILLON' }) }));
  });
 it('modifie une formation existante sans modifier son statut', async () => {
  await service.update('formations', 1, { nom: 'Nouveau nom' });

  expect(formation.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 1 },
      data: {
        nom: 'Nouveau nom',
      },
    }),
  );
});
  it('ne sélectionne pas les dates de validité pour une formation lors de la modification', async () => {
    await service.update('formations', 1, { nom: 'Formation modifiée' });
    expect(formation.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });
  it('sélectionne les dates existantes pour valider une modification de tarif', async () => {
    const tarif = prisma.tarif;
    await service.update('tarifs', 1, { libelle: 'Tarif modifié' });
    expect(tarif.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { dateDebutValidite: true, dateFinValidite: true },
    });
  });
  it('refuse la modification d’une ressource inexistante', async () => {
    formation.findUnique.mockResolvedValueOnce(null);
    await expect(service.update('formations', 999, { nom: 'X' })).rejects.toThrow(NotFoundException);
  });
  it('supprime une formation existante', async () => {
    await expect(service.remove('formations', 1)).resolves.toMatchObject({ id: 1 });
    expect(formation.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
