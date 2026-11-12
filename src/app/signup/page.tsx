import { redirect } from 'next/navigation';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const role = typeof params.role === 'string' ? `&role=${encodeURIComponent(params.role)}` : '';
  redirect(`/login?tab=signup${role}`);
}

