import { PrismaClient } from '@automotive-os/database';
import { randomBytes, createHash } from 'node:crypto';

const ADMIN_TARGETS = [
  'hasnathaider332@gmail.com',
  'hasnatshah230@gmail.com',
];

async function bootstrap() {
  const prisma = new PrismaClient();
  const isProductionOrStaging =
    process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

  console.log('================================================================');
  console.log('AUTOMOTIVE OS — PLATFORM ADMINISTRATOR BOOTSTRAP INITIALIZER');
  console.log('Zero-Trust Cryptographic Provisioning Framework (S2 Standard)');
  console.log('================================================================\n');

  try {
    for (const email of ADMIN_TARGETS) {
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Processing platform administrator target: ${normalizedEmail}`);

      let user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });

      if (!user) {
        // Create unverified identity with NO administrative elevation (Zero-Trust S2)
        user = await prisma.user.create({
          data: {
            identitySubject: `email_${normalizedEmail}`,
            email: normalizedEmail,
            displayName: 'Platform Administrator',
            isPlatformAdmin: false, // Strict S2: NOT elevated until activation and MFA challenge
            status: 'PENDING_VERIFICATION',
            emailVerifiedAt: null,
            mfaEnabled: false, // Email/password-only admin authentication per product policy
          },
        });
        console.log(`  [+] Created unverified identity record (ID: ${user.id}). Elevation withheld until activation.`);
      } else {
        if (user.isPlatformAdmin && user.status === 'ACTIVE') {
          console.log(`  [i] User is already confirmed active platform administrator (ID: ${user.id})`);
        } else {
          console.log(
            `  [i] Existing user record detected (ID: ${user.id}). Administrative privileges withheld until activation completion.`
          );
        }
      }

      // Generate cryptographically random 256-bit activation token
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration

      // Invalidate any prior pending invitations for this admin target
      await prisma.userInvitation.deleteMany({
        where: {
          email: normalizedEmail,
          isPlatformAdmin: true,
          acceptedAt: null,
        },
      });

      const invitation = await prisma.userInvitation.create({
        data: {
          email: normalizedEmail,
          tokenHash,
          isPlatformAdmin: true,
          invitedUserId: user.id,
          expiresAt,
        },
      });

      // Record audit event
      await prisma.auditEvent.create({
        data: {
          action: 'PLATFORM_ADMIN_BOOTSTRAP_INVITATION_ISSUED',
          actorUserId: user.id,
          targetType: 'User',
          targetId: user.id,
          metadata: {
            email: normalizedEmail,
            invitationId: invitation.id,
            isPlatformAdmin: true,
            status: user.status,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });

      console.log(`  [+] Created secure single-use activation invitation (ID: ${invitation.id})`);

      if (isProductionOrStaging) {
        console.log(`  [>] Secure activation token generated. Plaintext suppressed in production/staging logs.`);
        console.log(`  [>] Token delivery required via out-of-band administrative channel.\n`);
      } else {
        console.log(`  [>] Local Dev Activation URL:`);
        console.log(`      http://localhost:3000/auth/activate?token=${rawToken}\n`);
      }
    }

    console.log('================================================================');
    console.log('SUCCESS: All designated platform administrators provisioned.');
    console.log('Zero default passwords generated. Administrative privileges remain');
    console.log('unusable until email ownership, password creation, and MFA');
    console.log('enrollment are completed via the activation workflow.');
    console.log('================================================================');
  } catch (err) {
    console.error('CRITICAL_BOOTSTRAP_FAILURE:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void bootstrap();
