import { redirect } from 'next/navigation';

export default function LegacyRegisterRedirect() {
  redirect('/auth?tab=register');
}
