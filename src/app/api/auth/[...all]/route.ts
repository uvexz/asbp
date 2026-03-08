
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import {
  checkRegistrationStatus,
  postRegistrationCleanup,
  withRegistrationBootstrapLock,
} from "@/app/actions/auth-helpers";

const authHandler = toNextJsHandler(auth);

function isEmailSignUpRequest(request: Request) {
  return new URL(request.url).pathname.endsWith('/sign-up/email');
}

async function getSignUpEmail(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const body = await request.clone().json();
      return typeof body?.email === 'string' ? body.email : null;
    }

    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.clone().formData();
      const email = formData.get('email');
      return typeof email === 'string' ? email : null;
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET(request: Request) {
  return authHandler.GET(request);
}

export async function POST(request: Request) {
  if (!isEmailSignUpRequest(request)) {
    return authHandler.POST(request);
  }

  return withRegistrationBootstrapLock(async () => {
    const registrationStatus = await checkRegistrationStatus();

    if (!registrationStatus.allowed) {
      return Response.json(
        {
          code: 'REGISTRATION_CLOSED',
          message: 'Registration is closed',
        },
        { status: 403 },
      );
    }

    const email = await getSignUpEmail(request);
    const response = await authHandler.POST(request);

    if (response.ok && email) {
      await postRegistrationCleanup(email, {
        bootstrapFirstUser: registrationStatus.isFirstUser,
      });
    }

    return response;
  });
}

export const PATCH = authHandler.PATCH;
export const PUT = authHandler.PUT;
export const DELETE = authHandler.DELETE;
