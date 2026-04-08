"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// d:\PROJETS\COURS REACT\e-l\backend\src\config\db.ts
const client_1 = require("../generated/client");
const prisma = new client_1.PrismaClient();
exports.default = prisma;
