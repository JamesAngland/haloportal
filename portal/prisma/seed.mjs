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

  // Admin user for user management section
  const adminPasswordHash = await bcrypt.hash("admin1234", 10);
  await db.portalUser.upsert({
    where: { clientId_email: { clientId: client.id, email: "admin@example.co" } },
    update: {},
    create: {
      clientId: client.id,
      email: "admin@example.co",
      name: "Example Admin",
      role: "admin",
      passwordHash: adminPasswordHash
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

  // Create additional dummy devices (roughly 20 total)
  const extraAssets = [
    {
      haloAssetId: "HALO-ASSET-002",
      name: "Spare Laptop",
      serialNumber: "XYZ98765",
      assetType: "Laptop",
      osName: "macOS 12.6",
      purchaseDate: new Date("2021-03-01T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-003",
      name: "Reception PC",
      serialNumber: "PC-0003",
      assetType: "Desktop",
      osName: "Windows 11 Pro 23H2",
      purchaseDate: new Date("2023-01-10T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-004",
      name: "Finance Laptop 1",
      serialNumber: "FIN-0001",
      assetType: "Laptop",
      osName: "Windows 10 Pro 22H2",
      purchaseDate: new Date("2018-08-15T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-005",
      name: "Finance Laptop 2",
      serialNumber: "FIN-0002",
      assetType: "Laptop",
      osName: "Windows 11 Pro 23H2",
      purchaseDate: new Date("2022-05-21T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-006",
      name: "Warehouse Terminal 1",
      serialNumber: "WH-TERM-01",
      assetType: "Desktop",
      osName: "Windows 10 Pro 22H2",
      purchaseDate: new Date("2017-11-03T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-007",
      name: "Warehouse Terminal 2",
      serialNumber: "WH-TERM-02",
      assetType: "Desktop",
      osName: "Windows 11 Pro 23H2",
      purchaseDate: new Date("2021-09-09T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-008",
      name: "CEO MacBook",
      serialNumber: "CEO-MAC-01",
      assetType: "Laptop",
      osName: "macOS 13.6",
      purchaseDate: new Date("2022-11-12T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-009",
      name: "Marketing iMac",
      serialNumber: "MKT-IMAC-01",
      assetType: "Desktop",
      osName: "macOS 12.6",
      purchaseDate: new Date("2020-02-05T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-010",
      name: "Support Laptop 1",
      serialNumber: "SUP-0001",
      assetType: "Laptop",
      osName: "Windows 10 Pro 22H2",
      purchaseDate: new Date("2019-04-17T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-011",
      name: "Support Laptop 2",
      serialNumber: "SUP-0002",
      assetType: "Laptop",
      osName: "Windows 11 Pro 23H2",
      purchaseDate: new Date("2023-03-29T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-012",
      name: "Dev Workstation 1",
      serialNumber: "DEV-WS-01",
      assetType: "Desktop",
      osName: "Ubuntu 22.04",
      purchaseDate: new Date("2021-06-01T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-013",
      name: "Dev Workstation 2",
      serialNumber: "DEV-WS-02",
      assetType: "Desktop",
      osName: "Ubuntu 22.04",
      purchaseDate: new Date("2020-12-10T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-014",
      name: "Spare Mac Mini",
      serialNumber: "MACMINI-01",
      assetType: "Desktop",
      osName: "macOS 11.7",
      purchaseDate: new Date("2019-09-01T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-015",
      name: "Lab PC 1",
      serialNumber: "LAB-PC-01",
      assetType: "Desktop",
      osName: "Windows 10 Pro 22H2",
      purchaseDate: new Date("2018-01-15T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-016",
      name: "Lab PC 2",
      serialNumber: "LAB-PC-02",
      assetType: "Desktop",
      osName: "Windows 11 Pro 23H2",
      purchaseDate: new Date("2022-07-20T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-017",
      name: "Conference Room NUC",
      serialNumber: "MEET-NUC-01",
      assetType: "Mini PC",
      osName: "Windows 10 Pro 22H2",
      purchaseDate: new Date("2019-10-10T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-018",
      name: "Conference Room Mac Mini",
      serialNumber: "MEET-MACMINI-01",
      assetType: "Desktop",
      osName: "macOS 12.6",
      purchaseDate: new Date("2021-01-25T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-019",
      name: "Field Engineer Laptop 1",
      serialNumber: "FIELD-0001",
      assetType: "Laptop",
      osName: "Windows 10 Pro 22H2",
      purchaseDate: new Date("2018-05-30T00:00:00Z")
    },
    {
      haloAssetId: "HALO-ASSET-020",
      name: "Field Engineer Laptop 2",
      serialNumber: "FIELD-0002",
      assetType: "Laptop",
      osName: "Windows 11 Pro 23H2",
      purchaseDate: new Date("2023-02-14T00:00:00Z")
    }
  ];

  for (const asset of extraAssets) {
    await db.haloAsset.upsert({
      where: { haloAssetId: asset.haloAssetId },
      update: {
        clientId: client.id
      },
      create: {
        clientId: client.id,
        ...asset
      }
    });
  }

  // Assign one device to the seeded user
  await db.assetAssignment.upsert({
    where: { assetId: a1.id },
    update: { portalUserId: user.id },
    create: { assetId: a1.id, portalUserId: user.id, source: "sync" }
  });

  // Seed license vendors and sample SKUs for demo matrix
  const vendorsData = [
    { name: "microsoft", label: "Microsoft 365" },
    { name: "google", label: "Google Workspace" },
    { name: "dropbox", label: "Dropbox" },
    { name: "box", label: "Box" },
    { name: "adobe", label: "Adobe" }
  ];

  const vendors = {};
  for (const v of vendorsData) {
    // eslint-disable-next-line no-await-in-loop
    vendors[v.name] = await db.licenseVendor.upsert({
      where: { name: v.name },
      update: { label: v.label },
      create: { name: v.name, label: v.label }
    });
  }

  const definitions = [
    // Microsoft
    { vendor: "microsoft", code: "M365_BUSINESS_STANDARD", name: "M365 Business Standard" },
    { vendor: "microsoft", code: "M365_E3", name: "M365 E3" },
    { vendor: "microsoft", code: "M365_E5", name: "M365 E5" },
    // Google
    { vendor: "google", code: "GW_BUSINESS_STARTER", name: "Business Starter" },
    { vendor: "google", code: "GW_BUSINESS_STANDARD", name: "Business Standard" },
    // Dropbox
    { vendor: "dropbox", code: "DBX_STANDARD", name: "Standard" },
    { vendor: "dropbox", code: "DBX_ADVANCED", name: "Advanced" },
    // Box
    { vendor: "box", code: "BOX_BUSINESS", name: "Business" },
    { vendor: "box", code: "BOX_BUSINESS_PLUS", name: "Business Plus" },
    // Adobe
    { vendor: "adobe", code: "ADOBE_CC_ALL_APPS", name: "Creative Cloud All Apps" },
    { vendor: "adobe", code: "ADOBE_ACROBAT_PRO", name: "Acrobat Pro" }
  ];

  const licenseDefsByCode = {};
  for (const def of definitions) {
    const vendor = vendors[def.vendor];
    if (!vendor) continue;
    // eslint-disable-next-line no-await-in-loop
    const created = await db.licenseDefinition.upsert({
      where: {
        vendorId_code: {
          vendorId: vendor.id,
          code: def.code
        }
      },
      update: { name: def.name },
      create: {
        vendorId: vendor.id,
        code: def.code,
        name: def.name
      }
    });
    licenseDefsByCode[def.code] = created;
  }

  // Give the example user a couple of licenses for demo purposes
  const exampleLicenses = [
    "M365_BUSINESS_STANDARD",
    "GW_BUSINESS_STARTER",
    "ADOBE_CC_ALL_APPS"
  ];
  for (const code of exampleLicenses) {
    const lic = licenseDefsByCode[code];
    if (!lic) continue;
    // eslint-disable-next-line no-await-in-loop
    await db.licenseAssignment.upsert({
      where: {
        userId_licenseId: {
          userId: user.id,
          licenseId: lic.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        licenseId: lic.id
      }
    });
  }
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

