import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const existingClient = await db.client.findFirst({ where: { name: "Example Co" } });
  const client =
    existingClient ??
    (await db.client.create({
      data: {
        name: "Example Co",
        haloCustomerId: "HALO-CUST-001"
      }
    }));

  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await db.portalUser.upsert({
    where: { clientId_email: { clientId: client.id, email: "user@example.co" } },
    update: {},
    create: {
      clientId: client.id,
      email: "user@example.co",
      name: "Example User",
      role: "user",
      passwordHash
    }
  });

  // OS lifecycle examples (you'll replace this with your automated updater job)
  await db.osLifecycle.upsert({
    where: {
      vendor_family_version: { vendor: "windows", family: "Windows 10", version: "22H2" }
    },
    update: { eolDate: new Date("2025-10-14T00:00:00Z"), supportPhase: "extended" },
    create: {
      vendor: "windows",
      family: "Windows 10",
      version: "22H2",
      eolDate: new Date("2025-10-14T00:00:00Z"),
      supportPhase: "extended",
      sourceUrl: "https://learn.microsoft.com/"
    }
  });

  await db.osLifecycle.upsert({
    where: {
      vendor_family_version: { vendor: "macos", family: "macOS", version: "12" }
    },
    update: { eolDate: new Date("2024-09-01T00:00:00Z"), supportPhase: "eol" },
    create: {
      vendor: "macos",
      family: "macOS",
      version: "12",
      eolDate: new Date("2024-09-01T00:00:00Z"),
      supportPhase: "eol",
      sourceUrl: "https://support.apple.com/"
    }
  });

  // Seed some Halo assets
  const a1 = await db.haloAsset.upsert({
    where: { haloAssetId: "HALO-ASSET-001" },
    update: {
      clientId: client.id
    },
    create: {
      clientId: client.id,
      haloAssetId: "HALO-ASSET-001",
      name: "James’s Laptop",
      serialNumber: "ABC12345",
      assetType: "Laptop",
      osName: "Windows 10 Pro 22H2",
      purchaseDate: new Date("2019-02-01T00:00:00Z")
    }
  });

  await db.haloAsset.upsert({
    where: { haloAssetId: "HALO-ASSET-002" },
    update: {
      clientId: client.id
    },
    create: {
      clientId: client.id,
      haloAssetId: "HALO-ASSET-002",
      name: "Spare Laptop",
      serialNumber: "XYZ98765",
      assetType: "Laptop",
      osName: "macOS 12.6",
      purchaseDate: new Date("2021-03-01T00:00:00Z")
    }
  });

  // Assign one device to the seeded user
  await db.assetAssignment.upsert({
    where: { assetId: a1.id },
    update: { portalUserId: user.id },
    create: { assetId: a1.id, portalUserId: user.id, source: "sync" }
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

