import { redirect } from "next/navigation";

export const dynamic = "force-static";

export function GET() {
  const def = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "de").trim();
  redirect(`/${def}`);
}
