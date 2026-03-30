
export function isPro(user: any) {
  return !!user?.isPro;
}

export function requirePro(user: any) {
  if (!user?.isPro) {
    throw new Error("PRO_REQUIRED");
  }
}