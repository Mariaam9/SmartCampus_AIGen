
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL est absente du fichier .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type FormationSeed = {
  nom: string;
  description: string;
  niveau: string;
  duree: string;
  specialites?: {
    nom: string;
    description?: string;
    programmes?: {
      nom: string;
      description?: string;
      annee?: number;
      matieres?: {
        code: string;
        nom: string;
        credits?: number;
        semestre?: number;
      }[];
    }[];
  }[];
  admission?: string;
  prerequis?: string;
  tarif?: {
    libelle: string;
    montant: number;
    modalitesPaiement?: string;
  };
};

const catalogue: Record<string, FormationSeed[]> = {
  // =========================================================
  // IIT - Institut International de Technologie
  // =========================================================
  IIT: [
    {
      nom: "Cycle Préparatoire aux Études d'Ingénieurs",
      description: "Cycle préparatoire aux études d'ingénieurs de l'IIT.",
      niveau: "Cycle préparatoire",
      duree: "2 ans",
      admission:
        "Accès au cycle préparatoire selon les conditions d'admission publiées par l'IIT.",
      prerequis:
        "Baccalauréat ou diplôme admis selon les conditions de l'IIT.",
      tarif: {
        libelle: "Frais de scolarité annuels - tarif indicatif",
        montant: 2900,
        modalitesPaiement:
          "Montant publié dans le guide officiel des étudiants, exprimé en euros.",
      },
    },
    {
      nom: "Génie Informatique",
      description:
        "Diplôme d'ingénieur en Génie Informatique, accrédité Euro-Inf niveau Master.",
      niveau: "Ingénieur",
      duree: "3 ans",
      admission:
        "Accès après cycle préparatoire, licence ou diplôme admis selon les prérequis publiés par l'IIT.",
      prerequis:
        "Diplôme de préparatoire ou licence dans une spécialité informatique/technologique admissible.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 778,
        modalitesPaiement:
          "778 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
      specialites: [
        {
          nom: "GLID - Génie Logiciel et Informatique Décisionnelle",
          description:
            "Conception et développement de logiciels, architecture logicielle, gestion des données et informatique décisionnelle.",
        },
        {
          nom: "ARSI - Administration Réseau et Sécurité Informatique",
          description:
            "Réseaux, administration des systèmes, infrastructures Cloud, cybersécurité et sécurité des systèmes d'information.",
        },
        {
          nom: "SDIA - Science des Données et Intelligence Artificielle",
          description:
            "Analyse des données, apprentissage automatique, apprentissage profond et solutions intelligentes.",
        },
      ],
    },
    {
      nom: "Génie Civil",
      description: "Formation d'ingénieur en Génie Civil.",
      niveau: "Ingénieur",
      duree: "3 ans",
      admission:
        "Accès après prépa, licence ou diplôme admis selon les conditions publiées par l'IIT.",
      prerequis:
        "Diplôme de préparatoire MP/PC/PT ou licence admissible.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 556,
        modalitesPaiement:
          "556 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
    },
    {
      nom: "Génie Industriel",
      description:
        "Formation d'ingénieur visant l'optimisation des processus et systèmes industriels.",
      niveau: "Ingénieur",
      duree: "3 ans",
      admission:
        "Accès après prépa, licence ou diplôme admis selon les conditions publiées par l'IIT.",
      prerequis:
        "Prépa, licence ou mastère selon les conditions publiées par l'IIT.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 611,
        modalitesPaiement:
          "611 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
    },
    {
      nom: "Génie Mécanique",
      description: "Formation d'ingénieur en Génie Mécanique.",
      niveau: "Ingénieur",
      duree: "3 ans",
      admission:
        "Accès selon les conditions d'admission publiées par l'IIT.",
      prerequis:
        "Prépa, licence ou diplôme admissible selon les conditions de l'IIT.",
    },
    {
      nom: "Génie des Procédés",
      description: "Formation d'ingénieur en Génie des Procédés.",
      niveau: "Ingénieur",
      duree: "3 ans",
      admission:
        "Accès selon les conditions d'admission publiées par l'IIT.",
      prerequis:
        "Prépa, licence ou diplôme admissible selon les conditions de l'IIT.",
    },
    {
      nom: "Génie des Télécommunications",
      description:
        "Formation d'ingénieur en Génie des Télécommunications proposée par l'IIT.",
      niveau: "Ingénieur",
      duree: "3 ans",
      admission:
        "Accès selon les conditions d'admission publiées par l'IIT.",
      prerequis:
        "Prépa, licence ou diplôme admissible selon les conditions de l'IIT.",
    },
    {
      nom: "Licence en Systèmes Électriques Intelligents & Énergies Renouvelables",
      description:
        "Licence technologique publiée dans le catalogue des licences de l'IIT.",
      niveau: "Licence",
      duree: "3 ans",
    },
    {
      nom: "Licence en Mécatronique & Systèmes Intelligents",
      description:
        "Licence combinant mécatronique, robotique, systèmes embarqués et intelligence artificielle.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Baccalauréat scientifique, selon les conditions publiées par l'IIT.",
      prerequis:
        "Bac Mathématiques, Sciences expérimentales, Informatique ou Technique.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 567,
        modalitesPaiement:
          "567 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
    },
    {
      nom: "Licence en Réseaux et Cybersécurité",
      description:
        "Licence en informatique spécialisée en réseaux, cybersécurité, Cloud et protection des systèmes d'information.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Baccalauréat selon les conditions publiées par l'IIT.",
      prerequis:
        "BAC Mathématiques, Sciences expérimentales, Informatique, Économie & Gestion ou Technique.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 667,
        modalitesPaiement:
          "667 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
    },
    {
      nom: "Licence en Systèmes Embarqués & IoT",
      description:
        "Licence en systèmes embarqués et Internet des Objets.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Baccalauréat selon les conditions publiées par l'IIT.",
      prerequis:
        "BAC Mathématiques, Sciences, Informatique, Économie & Gestion ou Technique.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 667,
        modalitesPaiement:
          "667 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
    },
    {
      nom: "Licence en Big Data et Analyse de Données",
      description:
        "Licence en informatique orientée Big Data, Data Science et intelligence artificielle.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Baccalauréat selon les conditions publiées par l'IIT.",
      prerequis:
        "BAC Mathématiques, Sciences expérimentales, Informatique, Économie & Gestion ou Technique.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 667,
        modalitesPaiement:
          "667 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
    },
    {
      nom: "Licence en Génie Logiciel et Système d'Information",
      description:
        "Licence informatique orientée conception, développement, test et maintenance des systèmes informatiques.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Baccalauréat selon les conditions publiées par l'IIT.",
      prerequis:
        "Bac scientifique, informatique ou technique selon les conditions publiées par l'IIT.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 667,
        modalitesPaiement:
          "667 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
      specialites: [
        {
          nom: "Génie Logiciel et Système d'Information",
          programmes: [
            {
              nom: "1ère année",
              annee: 1,
              matieres: [
                {
                  code: "IIT-GLSI-ALG1",
                  nom: "Algèbre 1",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-ANA1",
                  nom: "Analyse 1",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-ALGO1",
                  nom: "Algorithmique et structure de données",
                  credits: 4,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-PROG1",
                  nom: "Atelier de programmation 1",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-OS1",
                  nom: "Système d'exploitation 1",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-BDD1",
                  nom: "Fondements des bases de données",
                  credits: 4,
                  semestre: 2,
                },
                {
                  code: "IIT-GLSI-PY",
                  nom: "Programmation Python",
                  credits: 2,
                  semestre: 2,
                },
                {
                  code: "IIT-GLSI-RESEAUX",
                  nom: "Fondements des réseaux",
                  credits: 4,
                  semestre: 2,
                },
              ],
            },
            {
              nom: "2ème année",
              annee: 2,
              matieres: [
                {
                  code: "IIT-GLSI-PROB",
                  nom: "Probabilité et statistique",
                  credits: 4,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-JAVA",
                  nom: "Programmation Java",
                  credits: 4,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-CSI",
                  nom: "Conception des Systèmes d'Information",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-IDB",
                  nom: "Ingénierie des Bases de Données",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-GL",
                  nom: "Problem Solving",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-WEB",
                  nom: "Technologies et programmation web",
                  credits: 3,
                  semestre: 2,
                },
                {
                  code: "IIT-GLSI-TEST",
                  nom: "Tests des logiciels",
                  credits: 2,
                  semestre: 2,
                },
                {
                  code: "IIT-GLSI-IA",
                  nom: "Fondements de l'intelligence artificielle",
                  credits: 4,
                  semestre: 2,
                },
                {
                  code: "IIT-GLSI-DOTNET",
                  nom: "Programmation .NET",
                  credits: 3,
                  semestre: 2,
                },
              ],
            },
            {
              nom: "3ème année",
              annee: 3,
              matieres: [
                {
                  code: "IIT-GLSI-BIGDATA",
                  nom: "Framework et technologies Big Data",
                  credits: 2,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-CLOUD",
                  nom: "Virtualisation et Cloud",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-MOBILE",
                  nom: "Développement Mobile",
                  credits: 2,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-DIST",
                  nom: "Développement applications réparties",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-ML",
                  nom: "Machine Learning",
                  credits: 2,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-SOA",
                  nom: "Architecture SOA et services web",
                  credits: 4,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-BI",
                  nom: "Business Intelligence",
                  credits: 3,
                  semestre: 1,
                },
                {
                  code: "IIT-GLSI-PFE",
                  nom: "Projet de fin d'étude",
                  credits: 30,
                  semestre: 2,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nom: "Mastère Industrie V4.0",
      description:
        "Mastère orienté Industrie 4.0, IoT, systèmes cyber-physiques, réalité virtuelle, Cloud et Big Data.",
      niveau: "Mastère",
      duree: "2 ans",
      prerequis: "Licence.",
      tarif: {
        libelle: "Frais de scolarité - première année, tarif indicatif",
        montant: 556,
        modalitesPaiement:
          "556 DT / 9 mois pour les étudiants nationaux. Tarif indicatif publié par l'IIT.",
      },
    },
  ],

  // =========================================================
  // ISA - International School of Architecture
  // =========================================================
  ISA: [
    {
      nom: "Architecture",
      description:
        "Cursus Architecture de l'International School of Architecture (ISA), département architecture de l'IIT.",
      niveau: "Architecture",
      duree: "6 ans",
      admission:
        "Admission en première année selon les conditions publiées par l'ISA.",
      prerequis:
        "Baccalauréat pour l'accès en première année, selon les conditions publiées par l'ISA.",
      tarif: {
        libelle: "Frais de scolarité annuels - guide officiel",
        montant: 3300,
        modalitesPaiement:
          "Montant publié dans le guide officiel des étudiants, exprimé en euros.",
      },
      specialites: [
        {
          nom: "Architecture",
          programmes: [
            { nom: "1ère année", annee: 1 },
            { nom: "2ème année", annee: 2 },
            { nom: "3ème année", annee: 3 },
            { nom: "4ème année", annee: 4 },
            { nom: "5ème année", annee: 5 },
            {
              nom: "6ème année - Stage professionnel",
              annee: 6,
            },
          ],
        },
      ],
    },
  ],

  // =========================================================
  // ISB - International School of Business
  // =========================================================
  ISB: [
    {
      nom: "Licence in Business Administration",
      description:
        "Licence en administration des affaires enseignée en anglais.",
      niveau: "Licence",
      duree: "3 ans",
      admission: "Baccalauréat.",
      prerequis: "Baccalauréat.",
      specialites: [
        {
          nom: "Business Administration",
          programmes: [
            {
              nom: "Licence in Business Administration",
              annee: 1,
            },
          ],
        },
      ],
    },
    {
      nom: "Licence in Business Intelligence",
      description:
        "Licence en Business Intelligence, bilingue.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Admission selon les conditions publiées par l'ISB.",
      prerequis: "Baccalauréat.",
      specialites: [
        {
          nom: "Business Intelligence",
          programmes: [
            {
              nom: "Licence in Business Intelligence",
              annee: 1,
            },
          ],
        },
      ],
    },
    {
      nom: "Licence Nationale en Gestion",
      description:
        "Licence nationale en gestion avec plusieurs parcours.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Admission selon les conditions publiées par l'ISB.",
      prerequis: "Baccalauréat.",
      specialites: [
        {
          nom: "Management",
          programmes: [{ nom: "Management", annee: 1 }],
        },
        {
          nom: "Comptabilité",
          programmes: [{ nom: "Comptabilité", annee: 1 }],
        },
        {
          nom: "Finance",
          programmes: [{ nom: "Finance", annee: 1 }],
        },
        {
          nom: "Logistique et production",
          programmes: [
            { nom: "Logistique et production", annee: 1 },
          ],
        },
        {
          nom: "Marketing",
          programmes: [{ nom: "Marketing", annee: 1 }],
        },
        {
          nom: "Ressources humaines",
          programmes: [
            { nom: "Ressources humaines", annee: 1 },
          ],
        },
      ],
    },
    {
      nom: "Licence en Sciences Économiques - Business Economics",
      description:
        "Licence nationale en Business Economics.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Admission selon les conditions publiées par l'ISB.",
      prerequis: "Baccalauréat.",
    },
    {
      nom: "Licence en Sciences Économiques - Transport et Logistique",
      description: "Licence en Transport et Logistique.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Admission selon les conditions publiées par l'ISB.",
      prerequis: "Baccalauréat.",
    },
    {
      nom: "Licence Nationale en Droit des Affaires",
      description:
        "Licence nationale en Droit des Affaires.",
      niveau: "Licence",
      duree: "3 ans",
      admission:
        "Admission selon les conditions publiées par l'ISB.",
      prerequis: "Baccalauréat.",
      specialites: [
        {
          nom: "Droit des Affaires",
          programmes: [
            { nom: "Droit des Affaires", annee: 1 },
          ],
        },
        {
          nom: "Droit Privé",
          programmes: [{ nom: "Droit Privé", annee: 1 }],
        },
      ],
    },
    {
      nom: "Mastère en Marketing Digital",
      description:
        "Mastère professionnel en Marketing Digital.",
      niveau: "Mastère",
      duree: "2 ans",
      prerequis: "Licence.",
    },
    {
      nom: "Master in Business Administration (MBA)",
      description:
        "MBA de l'International School of Business.",
      niveau: "MBA",
      duree: "2 ans",
      prerequis:
        "Licence ou diplôme admissible selon le programme.",
    },
    {
      nom: "Mastère en Comptabilité",
      description:
        "Mastère professionnel en comptabilité.",
      niveau: "Mastère",
      duree: "2 ans",
      prerequis: "Licence.",
    },
    {
      nom: "Mastère Finance d'Entreprise et Ingénierie Financière",
      description:
        "Mastère professionnel en finance d'entreprise et ingénierie financière.",
      niveau: "Mastère",
      duree: "2 ans",
      prerequis:
        "Licence ou maîtrise en gestion, finance ou comptabilité, ou diplôme équivalent.",
    },
    {
      nom: "Master of Science (MSc) in Digital Marketing",
      description: "Master of Science in Digital Marketing.",
      niveau: "MSc",
      duree: "2 ans",
      prerequis:
        "Licence ou diplôme admissible selon le programme.",
    },
    {
      nom: "Master of Science (MSc) in Finance",
      description: "Master of Science in Finance.",
      niveau: "MSc",
      duree: "2 ans",
      prerequis:
        "Licence ou diplôme admissible selon le programme.",
    },
    {
      nom: "Master in Business Law",
      description: "Master in Business Law.",
      niveau: "Master",
      duree: "2 ans",
      prerequis:
        "Licence ou diplôme admissible selon le programme.",
    },
    {
      nom: "Marketing des Produits et Services de Santé",
      description:
        "Programme de mastère publié dans le catalogue de l'ISB.",
      niveau: "Mastère",
      duree: "2 ans",
    },
    {
      nom: "Marketing : Distribution et Relation Client",
      description:
        "Programme de mastère publié dans le catalogue de l'ISB.",
      niveau: "Mastère",
      duree: "2 ans",
    },
    {
      nom: "Management et Marketing des Produits Agroalimentaires",
      description:
        "Programme de mastère publié dans le catalogue de l'ISB.",
      niveau: "Mastère",
      duree: "2 ans",
    },
    {
      nom: "Audit Interne",
      description:
        "Programme de mastère publié dans le catalogue de l'ISB.",
      niveau: "Mastère",
      duree: "2 ans",
    },
    {
      nom: "Finance Islamique",
      description:
        "Programme de mastère publié dans le catalogue de l'ISB.",
      niveau: "Mastère",
      duree: "2 ans",
    },
  ],
};

// =========================================================
// ÉTABLISSEMENTS
// =========================================================

async function getOrCreateEtablissement(
  code: string,
  nom: string,
  description: string,
) {
  return prisma.etablissement.upsert({
    where: { code },
    update: { nom, description },
    create: { code, nom, description },
  });
}

// =========================================================
// MATIÈRES
// =========================================================

async function upsertMatiere(
  programmeId: number,
  matiereData: {
    code: string;
    nom: string;
    credits?: number;
    semestre?: number;
  },
) {
  const matiere = await prisma.matiere.upsert({
    where: { code: matiereData.code },
    update: {
      nom: matiereData.nom,
      credits: matiereData.credits,
      description:
        "Matière issue du plan d'études officiel publié par l'IIT.",
    },
    create: {
      code: matiereData.code,
      nom: matiereData.nom,
      credits: matiereData.credits,
      description:
        "Matière issue du plan d'études officiel publié par l'IIT.",
    },
  });

  await prisma.programmeMatiere.upsert({
    where: {
      programmeId_matiereId: {
        programmeId,
        matiereId: matiere.id,
      },
    },
    update: {
      semestre: matiereData.semestre,
      coefficient: 1,
    },
    create: {
      programmeId,
      matiereId: matiere.id,
      semestre: matiereData.semestre,
      coefficient: 1,
    },
  });
}

// =========================================================
// FORMATIONS, CONDITIONS, PRÉREQUIS, TARIFS,
// SPÉCIALITÉS, PROGRAMMES ET MATIÈRES
// =========================================================

async function upsertFormation(
  etablissementId: number,
  data: FormationSeed,
) {
  let formation = await prisma.formation.findFirst({
    where: {
      etablissementId,
      nom: data.nom,
    },
  });

  if (formation) {
    formation = await prisma.formation.update({
      where: { id: formation.id },
      data: {
        description: data.description,
        niveau: data.niveau,
        duree: data.duree,
        statut: "PUBLIE",
      },
    });
  } else {
    formation = await prisma.formation.create({
      data: {
        etablissementId,
        nom: data.nom,
        description: data.description,
        niveau: data.niveau,
        duree: data.duree,
        statut: "PUBLIE",
      },
    });
  }

  // Conditions d'admission
  if (data.admission) {
    const existingAdmission =
      await prisma.conditionAdmission.findFirst({
        where: {
          formationId: formation.id,
          description: data.admission,
        },
      });

    if (existingAdmission) {
      await prisma.conditionAdmission.update({
        where: { id: existingAdmission.id },
        data: {
          statutPublication: "PUBLIE",
        },
      });
    } else {
      await prisma.conditionAdmission.create({
        data: {
          formationId: formation.id,
          description: data.admission,
          statutPublication: "PUBLIE",
        },
      });
    }
  }

  // Prérequis
  if (data.prerequis) {
    const existingPrerequis = await prisma.prerequis.findFirst({
      where: {
        formationId: formation.id,
        description: data.prerequis,
      },
    });

    if (existingPrerequis) {
      await prisma.prerequis.update({
        where: { id: existingPrerequis.id },
        data: {
          niveau: data.niveau,
        },
      });
    } else {
      await prisma.prerequis.create({
        data: {
          formationId: formation.id,
          description: data.prerequis,
          niveau: data.niveau,
        },
      });
    }
  }

  // Tarifs
  if (data.tarif) {
    const existingTarif = await prisma.tarif.findFirst({
      where: {
        formationId: formation.id,
        libelle: data.tarif.libelle,
      },
    });

    if (existingTarif) {
      await prisma.tarif.update({
        where: { id: existingTarif.id },
        data: {
          montant: data.tarif.montant,
          modalitesPaiement: data.tarif.modalitesPaiement,
          statutPublication: "PUBLIE",
        },
      });
    } else {
      await prisma.tarif.create({
        data: {
          formationId: formation.id,
          libelle: data.tarif.libelle,
          montant: data.tarif.montant,
          modalitesPaiement: data.tarif.modalitesPaiement,
          statutPublication: "PUBLIE",
        },
      });
    }
  }

  // Spécialités
  for (const specialiteData of data.specialites ?? []) {
    let specialite = await prisma.specialite.findFirst({
      where: {
        formationId: formation.id,
        nom: specialiteData.nom,
      },
    });

    if (specialite) {
      specialite = await prisma.specialite.update({
        where: { id: specialite.id },
        data: {
          description: specialiteData.description,
        },
      });
    } else {
      specialite = await prisma.specialite.create({
        data: {
          formationId: formation.id,
          nom: specialiteData.nom,
          description: specialiteData.description,
        },
      });
    }

    // Programmes
    for (const programmeData of specialiteData.programmes ?? []) {
      let programme = await prisma.programme.findFirst({
        where: {
          specialiteId: specialite.id,
          nom: programmeData.nom,
        },
      });

      if (programme) {
        programme = await prisma.programme.update({
          where: { id: programme.id },
          data: {
            description: programmeData.description,
            annee: programmeData.annee,
          },
        });
      } else {
        programme = await prisma.programme.create({
          data: {
            specialiteId: specialite.id,
            nom: programmeData.nom,
            description: programmeData.description,
            annee: programmeData.annee,
          },
        });
      }

      // Matières du programme
      for (const matiere of programmeData.matieres ?? []) {
        await upsertMatiere(programme.id, matiere);
      }
    }
  }
}

// =========================================================
// RESPONSABLES_NAU
// =========================================================

async function seedResponsables(
  etablissements: Record<
    string,
    Awaited<ReturnType<typeof getOrCreateEtablissement>>
  >,
) {
  const responsables = [
    {
      code: "IIT",
      email: "responsable.nau.iit@gmail.com",
      prenom: "IIT",
      fonction: "Responsable_NAU",
      service: "NAU",
    },
    {
      code: "ISA",
      email: "responsable.nau.isa@gmail.com",
      prenom: "ISA",
      fonction: "Responsable_NAU",
      service: "NAU",
    },
    {
      code: "ISB",
      email: "responsable.nau.isb@gmail.com",
      prenom: "ISB",
      fonction: "Responsable_NAU",
      service: "NAU",
    },
  ];

  // Le même mot de passe de démonstration pour les trois comptes.
  const passwordHash = await bcrypt.hash("Demo@2026!", 10);

  for (const data of responsables) {
    const etablissement = etablissements[data.code];

    if (!etablissement) {
      throw new Error(
        `Établissement introuvable pour le responsable ${data.email}`,
      );
    }

    // Recherche du compte par email.
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      // Mise à jour, y compris du mot de passe.
      // Cela garantit que le mot de passe reste Demo@2026!
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          nom: "Responsable_NAU",
          prenom: data.prenom,
          role: "RESPONSABLE",
          telephone: null,
        },
      });
    } else {
      // Création du compte s'il n'existe pas.
      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          nom: "Responsable_NAU",
          prenom: data.prenom,
          role: "RESPONSABLE",
        },
      });
    }

    // Association du responsable à son établissement.
    await prisma.responsable.upsert({
      where: { userId: user.id },
      update: {
        etablissementId: etablissement.id,
        fonction: data.fonction,
        service: data.service,
      },
      create: {
        userId: user.id,
        etablissementId: etablissement.id,
        fonction: data.fonction,
        service: data.service,
      },
    });

    console.log(
      `✅ Responsable ${data.email} associé à ${data.code}.`,
    );
  }
}

// =========================================================
// NETTOYAGE DES ANCIENS COMPTES DE DÉMONSTRATION
// =========================================================

async function deleteOldDemoAccounts() {
  const anciensEmails = [
    // Anciens comptes Responsable_NAU avec domaine de test.
    "responsable.nau.iit@smartcampus.test",
    "responsable.nau.isa@smartcampus.test",
    "responsable.nau.isb@smartcampus.test",

    // Anciens comptes de démonstration.
    "responsable.campus@smartcampus.test",
    "responsable.isb@smartcampus.test",
    "responsable.campus@gmail.com",
    "responsable.isb@gmail.com",
  ];

  const result = await prisma.user.deleteMany({
    where: {
      email: {
        in: anciensEmails,
      },
    },
  });

  console.log(
    `🧹 ${result.count} ancien(s) compte(s) de démonstration supprimé(s).`,
  );
}

// =========================================================
// MAIN
// =========================================================

async function main() {
  console.log("🌱 Début du peuplement officiel SmartCampus...");

  // -------------------------------------------------------
  // 1. Migration des anciens établissements fictifs
  // -------------------------------------------------------

  const ancienCampus = await prisma.etablissement.findUnique({
    where: { code: "CAMPUS-DEMO" },
  });

  if (ancienCampus) {
    await prisma.etablissement.update({
      where: { id: ancienCampus.id },
      data: {
        code: "IIT",
        nom: "Institut International de Technologie",
        description:
          "Institut International de Technologie de Sfax (IIT).",
      },
    });

    console.log("✅ Ancien établissement CAMPUS-DEMO renommé en IIT.");
  }

  const ancienIsb = await prisma.etablissement.findUnique({
    where: { code: "ISB-DEMO" },
  });

  if (ancienIsb) {
    await prisma.etablissement.update({
      where: { id: ancienIsb.id },
      data: {
        code: "ISB",
        nom: "International School of Business",
        description:
          "International School of Business (ISB), Sfax.",
      },
    });

    console.log("✅ Ancien établissement ISB-DEMO renommé en ISB.");
  }

  // -------------------------------------------------------
  // 2. Création / mise à jour des trois établissements
  // -------------------------------------------------------

  const iit = await getOrCreateEtablissement(
    "IIT",
    "Institut International de Technologie",
    "Institut International de Technologie de Sfax (IIT).",
  );

  const isa = await getOrCreateEtablissement(
    "ISA",
    "International School of Architecture",
    "International School of Architecture (ISA), département architecture de l'IIT.",
  );

  const isb = await getOrCreateEtablissement(
    "ISB",
    "International School of Business",
    "International School of Business (ISB), Sfax.",
  );

  console.log("✅ Établissements IIT, ISA et ISB configurés.");

  const etablissements = {
    IIT: iit,
    ISA: isa,
    ISB: isb,
  };

  // -------------------------------------------------------
  // 3. Chargement du catalogue de formations
  // -------------------------------------------------------

  for (const [code, formations] of Object.entries(catalogue)) {
    const etablissement = etablissements[code];

    if (!etablissement) {
      throw new Error(
        `Établissement ${code} introuvable dans la configuration.`,
      );
    }

    console.log(
      `📚 Chargement de ${formations.length} formations pour ${code}...`,
    );

    for (const formation of formations) {
      await upsertFormation(etablissement.id, formation);
    }
  }

  console.log("✅ Catalogue de formations chargé.");

  // -------------------------------------------------------
  // 4. Création / mise à jour des comptes Responsable_NAU
  // -------------------------------------------------------

  await seedResponsables(etablissements);

  // -------------------------------------------------------
  // 5. Suppression des anciens comptes fictifs
  // -------------------------------------------------------

  await deleteOldDemoAccounts();

  console.log("🎉 Peuplement officiel de la base terminé !");
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant le seed :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
