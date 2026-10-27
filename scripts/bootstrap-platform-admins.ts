import { PrismaClient } from '@automotive-os/database';
import { randomBytes, createHash } from 'node:crypto';

const ADMIN_TARGETS = [
  'hasnathaider332@gmail.com',
  'hasnatshah230@gmail.com',
];

async function bootstrap() {
  const prisma = new PrismaClient();
  console.log('================================================================');
  console.log('AUTOMOTIVE OS — PLATFORM ADMINISTRATOR BOOTSTRAP INITIALIZER');
  console.log('Zero-Trust Cryptographic Provisioning Framework');
  console.log('================================================================\n');

  try {
    for (const email of ADMIN_TARGETS) {
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`Processing platform administrator target: ${normalizedEmail}`);

      let user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            identitySubject: `email_${normalizedEmail}`,
            email: normalizedEmail,
            displayName: 'Platform Administrator',
            isPlatformAdmin: true,
            status: 'PENDING_VERIFICATION',
            mfaEnabled: true, // Mandatory MFA for platform admins
          },
        });
        console.log(`  [+] Created platform admin identity record (ID: ${user.id})`);
      } else {
        if (!user.isPlatformAdmin) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              isPlatformAdmin: true,
              mfaEnabled: true,
            },
          });
          console.log(`  [+] Elevated existing user record to platform administrator (ID: ${user.id})`);
        } else {
          console.log(`  [i] User is already confirmed platform administrator (ID: ${user.id})`);
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

      await prisma.userInvitation.create({
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
          action: 'PLATFORM_ADMIN_BOOTSTRAP_PROVISIONED',
          actorUserId: user.id,
          targetType: 'User',
          targetId: user.id,
          metadata: {
            email: normalizedEmail,
            isPlatformAdmin: true,
            status: user.status,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });

      console.log(`  [+] Generated secure single-use activation token (expires in 24 hours)`);
      console.log(`  [>] Activation URL:`);
      console.log(`      https://automotive-marketplace-staging.up.railway.app/auth/activate?token=${rawToken}`);
      console.log(`      Local dev: http://localhost:3000/auth/activate?token=${rawToken}\n`);
    }

    console.log('================================================================');
    console.log('SUCCESS: All designated platform administrators provisioned.');
    console.log('No default passwords generated. Administrators must complete');
    console.log('password setup and mandatory MFA activation via the token URL.');
    console.log('================================================================');
  } catch (err) {
    console.error('CRITICAL_BOOTSTRAP_FAILURE:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void bootstrap();
