"use client";

import { useMemo } from "react";
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
