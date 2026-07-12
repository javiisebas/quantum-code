import { redirect } from 'next/navigation';

/** Back-compat: the old spy URL now lives at `/join/codenames`. */
export default async function LegacySpyRedirect({
    searchParams,
}: {
    searchParams: Promise<{ code?: string }>;
}) {
    const { code } = await searchParams;
    redirect(code ? `/join/codenames?code=${encodeURIComponent(code)}` : '/join/codenames');
}
