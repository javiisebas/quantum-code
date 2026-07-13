import { redirect } from 'next/navigation';

/**
 * Back-compat for the original single-game URL. A code is now resolved by the platform, so an
 * old `/spy?code=NNNNNN` link goes to the short join link and lands in whatever game owns it.
 */
export default async function LegacySpyRedirect({
    searchParams,
}: {
    searchParams: Promise<{ code?: string }>;
}) {
    const { code } = await searchParams;
    redirect(code ? `/j/${encodeURIComponent(code)}` : '/join');
}
