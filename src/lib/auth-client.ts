
import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "@better-auth/passkey/client"

function getBaseURL(): string {
    // Use environment variable if available (must be prefixed with NEXT_PUBLIC_ for client-side access)
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL
    }
    // Fall back to window.location.origin in browser environment
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    // Default for SSR/build time
    return 'http://localhost:3000'
}

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
    plugins: [
        passkeyClient(),
    ],
})
