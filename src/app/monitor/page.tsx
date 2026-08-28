import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Legacy /monitor URL → homepage monitor. */
export default async function MonitorRedirectPage({ searchParams }: Props) {
  const raw = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") qs.set(k, v);
  }
  const tail = qs.toString();
  redirect(tail ? `/?${tail}` : "/");
}
