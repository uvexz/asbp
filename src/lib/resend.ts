import { Resend } from 'resend';
import { getSettings } from "@/app/actions/settings";

export async function getResendClient() {
    const settings = await getSettings();

    if (!settings.resendApiKey) {
        return null;
    }

    return new Resend(settings.resendApiKey);
}
