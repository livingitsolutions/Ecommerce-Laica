export type Principal = {
  userId: string;
  verified: boolean;
  status: "active" | "suspended";
  platformOwner: boolean;
};
export type Membership = {
  userId: string;
  sellerId: string;
  sellerActive: boolean;
  status: "active" | "suspended";
  role: string;
};
export function active(person: Principal) {
  return person.verified === true && person.status === "active";
}
export function platformAccess(person: Principal) {
  return active(person) && person.platformOwner === true;
}
export function customerAccess(
  person: Principal,
  owner: string,
  seller: string,
  resourceSeller: string,
) {
  return active(person) && person.userId === owner && seller === resourceSeller;
}
export function sellerRole(
  person: Principal,
  seller: string,
  member: Membership | null,
) {
  if (
    !active(person) ||
    !member ||
    member.userId !== person.userId ||
    member.sellerId !== seller ||
    member.status !== "active" ||
    member.sellerActive !== true
  )
    return null;
  if (["owner", "admin"].includes(member.role)) return "SELLER_ADMIN";
  return ["catalog", "fulfillment", "support"].includes(member.role)
    ? "SELLER_STAFF"
    : null;
}
