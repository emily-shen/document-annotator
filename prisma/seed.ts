import { PrismaClient } from "@prisma/client";
import data from "./data/data.json";

const prisma = new PrismaClient();
async function main() {
  for (let i = 0; i < data.length; i++) {
    let doc = await prisma.document.create({
      data: data[i],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
