/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2).filter((x) => x !== '--');
  if (args.length < 2) {
    console.error('usage: node prisma/createsu.js <email> <password>');
    process.exit(1);
  }
  const email = args[args.length - 2];
  const password = args[args.length - 1];
  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    console.error('account already exists');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await prisma.account.create({
    data: {
      email,
      password_hash: hash,
      role: 'admin',
      activated: true,
      admin: { create: {} }
    }
  });
  console.log('superuser created');
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
