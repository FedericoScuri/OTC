// ABIs mínimos (solo lo que el backend usa). Los contratos completos viven en
// /contracts y sus ABIs full están en frontend/lib/abis.ts.

const MockUSDC = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
];

const CommissionEscrow = [
  "function purchase(uint256 packageId, uint256 quantity, address agent) returns (uint256 bookingId)",
  "function getBooking(uint256 bookingId) view returns (tuple(uint256 packageId, address customer, address provider, address agent, uint256 amount, uint256 quantity, uint64 refundDeadline, uint8 status))",
  "event Purchased(uint256 indexed bookingId, uint256 indexed packageId, address indexed customer, address agent, uint256 amount, uint256 quantity)",
];

const TourPackageNFT = [
  "function totalPackages() view returns (uint256)",
  "function createPackage(uint8 category, string name, uint256 price, uint64 checkInDate, uint64 checkOutDate, uint64 refundDeadline, uint256 maxSupply) returns (uint256)",
  // getPackage devuelve el struct Package; lo leemos para deduplicar por nombre.
  "function getPackage(uint256) view returns (tuple(address provider, uint8 category, string name, uint256 price, uint64 checkInDate, uint64 checkOutDate, uint64 refundDeadline, uint256 maxSupply, uint256 minted, bool active))",
];

module.exports = { MockUSDC, TourPackageNFT, CommissionEscrow };
