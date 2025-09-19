// app/route.ts  (kök)
import { redirect } from "next/navigation";
export function GET() {
  redirect("/tr"); // Next 308
}
export const dynamic = "force-static";
