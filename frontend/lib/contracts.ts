"use client";

import { useMemo } from "react";
import { zeroAddress } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { useDeployment } from "./deployments";
import { MockUSDCAbi, TourPackageNFTAbi, CommissionEscrowAbi, SecondaryMarketAbi } from "./abis";

/**
 * Devuelve { address, abi } de cada contrato, listos para wagmi.
 * Las direcciones salen del deploy (useDeployment).
 */
export function useContracts() {
  const { contracts } = useDeployment();
  return useMemo(
    () => ({
      usdc: { address: contracts.MockUSDC, abi: MockUSDCAbi } as const,
      nft: { address: contracts.TourPackageNFT, abi: TourPackageNFTAbi } as const,
      escrow: { address: contracts.CommissionEscrow, abi: CommissionEscrowAbi } as const,
      market: { address: contracts.SecondaryMarket, abi: SecondaryMarketAbi } as const,
    }),
    [contracts],
  );
}

/** Forma decodificada del struct Package de TourPackageNFT. */
export type Package = {
  id: number;
  provider: `0x${string}`;
  category: number;
  name: string;
  price: bigint;
  checkInDate: bigint;
  checkOutDate: bigint;
  refundDeadline: bigint;
  maxSupply: bigint;
  minted: bigint;
  active: boolean;
};

/**
 * Lee todos los paquetes publicados: primero totalPackages(), despues
 * getPackage(id) para cada uno en batch.
 */
export function usePackages() {
  const { nft } = useContracts();

  const totalQuery = useReadContract({
    ...nft,
    functionName: "totalPackages",
  });

  const total = totalQuery.data ? Number(totalQuery.data) : 0;
  const ids = Array.from({ length: total }, (_, i) => i + 1);

  const packagesQuery = useReadContracts({
    contracts: ids.map((id) => ({
      ...nft,
      functionName: "getPackage" as const,
      args: [BigInt(id)] as const,
    })),
    query: { enabled: total > 0 },
  });

  const packages: Package[] = (packagesQuery.data ?? [])
    .map((res, i) => {
      if (res.status !== "success" || !res.result) return null;
      const p = res.result as unknown as Omit<Package, "id">;
      return { id: ids[i], ...p };
    })
    .filter((p): p is Package => p !== null);

  return {
    packages,
    total,
    isLoading: totalQuery.isLoading || packagesQuery.isLoading,
    refetch: () => {
      totalQuery.refetch();
      packagesQuery.refetch();
    },
  };
}

/** Estados del ciclo de vida de una reserva (enum Status del escrow). */
export const BOOKING_STATUS = ["None", "Pendiente", "Liberada", "Reembolsada"] as const;

/** Forma decodificada del struct Booking de CommissionEscrow. */
export type Booking = {
  id: number;
  packageId: bigint;
  customer: `0x${string}`;
  provider: `0x${string}`;
  agent: `0x${string}`;
  amount: bigint;
  quantity: bigint;
  refundDeadline: bigint;
  status: number;
};

/**
 * Lee todas las reservas registradas en el escrow: totalBookings() y luego
 * getBooking(id) en batch. Las páginas filtran por proveedor / cliente.
 */
export function useBookings() {
  const { escrow } = useContracts();

  const totalQuery = useReadContract({
    ...escrow,
    functionName: "totalBookings",
  });

  const total = totalQuery.data ? Number(totalQuery.data) : 0;
  const ids = Array.from({ length: total }, (_, i) => i + 1);

  const bookingsQuery = useReadContracts({
    contracts: ids.map((id) => ({
      ...escrow,
      functionName: "getBooking" as const,
      args: [BigInt(id)] as const,
    })),
    query: { enabled: total > 0 },
  });

  const bookings: Booking[] = (bookingsQuery.data ?? [])
    .map((res, i) => {
      if (res.status !== "success" || !res.result) return null;
      const b = res.result as unknown as Omit<Booking, "id">;
      return { id: ids[i], ...b };
    })
    .filter((b): b is Booking => b !== null);

  return {
    bookings,
    total,
    isLoading: totalQuery.isLoading || bookingsQuery.isLoading,
    refetch: () => {
      totalQuery.refetch();
      bookingsQuery.refetch();
    },
  };
}

/** Forma decodificada del struct Listing de SecondaryMarket. */
export type Listing = {
  id: number;
  seller: `0x${string}`;
  packageId: bigint;
  quantity: bigint;
  pricePerUnit: bigint;
  active: boolean;
};

/**
 * Lee todas las publicaciones del mercado secundario: totalListings() y luego
 * getListing(id) en batch. La página filtra las activas / las propias.
 */
export function useListings() {
  const { market } = useContracts();

  const totalQuery = useReadContract({
    ...market,
    functionName: "totalListings",
  });

  const total = totalQuery.data ? Number(totalQuery.data) : 0;
  const ids = Array.from({ length: total }, (_, i) => i + 1);

  const listingsQuery = useReadContracts({
    contracts: ids.map((id) => ({
      ...market,
      functionName: "getListing" as const,
      args: [BigInt(id)] as const,
    })),
    query: { enabled: total > 0 },
  });

  const listings: Listing[] = (listingsQuery.data ?? [])
    .map((res, i) => {
      if (res.status !== "success" || !res.result) return null;
      const l = res.result as unknown as Omit<Listing, "id">;
      return { id: ids[i], ...l };
    })
    .filter((l): l is Listing => l !== null);

  return {
    listings,
    total,
    isLoading: totalQuery.isLoading || listingsQuery.isLoading,
    refetch: () => {
      totalQuery.refetch();
      listingsQuery.refetch();
    },
  };
}

/** Un paquete que el usuario posee, con su saldo de unidades (para revender). */
export type OwnedReservation = { pkg: Package; balance: bigint };

/**
 * Reservas (NFTs ERC-1155) que tiene el `owner`: recorre todos los paquetes y
 * lee balanceOf(owner, packageId) en batch, devolviendo los de saldo > 0.
 */
export function useOwnedReservations(owner?: `0x${string}`) {
  const { nft } = useContracts();
  const { packages, isLoading: pkgLoading } = usePackages();

  const balancesQuery = useReadContracts({
    contracts: packages.map((p) => ({
      ...nft,
      functionName: "balanceOf" as const,
      args: [owner ?? zeroAddress, BigInt(p.id)] as const,
    })),
    query: { enabled: !!owner && packages.length > 0 },
  });

  const owned: OwnedReservation[] = (balancesQuery.data ?? [])
    .map((res, i) => {
      const balance = res.status === "success" ? (res.result as bigint) : 0n;
      return { pkg: packages[i], balance };
    })
    .filter((o) => o.balance > 0n);

  return {
    owned,
    isLoading: pkgLoading || balancesQuery.isLoading,
    refetch: () => balancesQuery.refetch(),
  };
}
