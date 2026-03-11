import { OsVendor } from "@prisma/client";

export type NormalizedOs = {
  vendor: OsVendor;
  family: string;
  version: string | null;
};

export function normalizeOs(osNameRaw: string | null | undefined): NormalizedOs | null {
  if (!osNameRaw) return null;
  const s = osNameRaw.trim();
  if (!s) return null;

  // Windows (examples: "Windows 10 Pro 22H2", "Windows 11 23H2")
  const win = s.match(/Windows\s+(10|11)\b.*?\b(\d{2}H\d)\b/i);
  if (win) {
    return {
      vendor: OsVendor.windows,
      family: `Windows ${win[1]}`,
      version: win[2].toUpperCase()
    };
  }

  // macOS (examples: "macOS 13.6", "Mac OS X 10.15.7")
  const mac = s.match(/\b(macOS|Mac\s?OS\s?X)\s+(\d+)(?:\.\d+)?/i);
  if (mac) {
    return {
      vendor: OsVendor.macos,
      family: "macOS",
      version: mac[2]
    };
  }

  // Ubuntu (examples: "Ubuntu 22.04", "Ubuntu 20.04.6 LTS")
  const ubuntu = s.match(/\bUbuntu\s+(\d{2}\.\d{2})/i);
  if (ubuntu) {
    return {
      vendor: OsVendor.ubuntu,
      family: "Ubuntu",
      version: ubuntu[1]
    };
  }

  // Debian (examples: "Debian 12", "Debian GNU/Linux 11")
  const deb = s.match(/\bDebian\b.*?\b(\d+)\b/i);
  if (deb) {
    return {
      vendor: OsVendor.debian,
      family: "Debian",
      version: deb[1]
    };
  }

  return {
    vendor: OsVendor.other,
    family: s,
    version: null
  };
}

