import { redirect } from "next/navigation";

export default function MadingDetailRedirectPage({ params }) {
  const { id } = params || {};
  if (id) {
    redirect(`/pengumuman/${id}`);
  }
  redirect("/pengumuman");
}
