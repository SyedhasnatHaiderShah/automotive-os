import { redirect } from 'next/navigation';

/**
 * The former "dossier" page only rendered a static persona (EID, IBAN, AECB,
 * escrow). No API backs that content, so the route sends buyers to the real
 * profile page instead.
 */
export default function BuyerDossierRedirectPage() {
  redirect('/account/profile');
}
