import { prisma } from "../src/lib/db";

console.log("Retrase.ro does not seed user or commercial data. Run an importer to load official datasets.");
prisma.$disconnect();
