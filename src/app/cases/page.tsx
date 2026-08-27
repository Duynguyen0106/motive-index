import { redirect } from "next/navigation";

/** Legacy /cases URL → canonical archive. */
export default function CasesRedirectPage() {
  redirect("/archive");
}
