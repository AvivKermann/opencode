import { createServer } from "node:http"
import { randomBytes } from "node:crypto"

export const scopes = "user-read-playback-state user-read-currently-playing user-modify-playback-state"

export async function authorize({ clientID, redirectURI, signal, open }) {
    const redirect = new URL(redirectURI)
    if (redirect.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(redirect.hostname) || redirect.search || redirect.hash || redirect.username || redirect.password) {
        throw new Error("Set SPOTIFY_REDIRECT_URI to an HTTP loopback callback (e.g. http://127.0.0.1:8888/callback) and register the exact URI in your Spotify app. Spotify does not accept localhost.")
    }
    signal.throwIfAborted()
    const state = randomBytes(32).toString("hex")
    let resolveCode, rejectCode
    const callback = new Promise((resolve, reject) => { resolveCode = resolve; rejectCode = reject })
    // Observe rejection while browser launch or server startup is still pending.
    void callback.catch(() => {})
    let consumed = false
    const server = createServer((request, response) => {
        const url = new URL(request.url || "/", redirect.origin)
        response.setHeader("Content-Type", "text/plain; charset=utf-8")
        response.setHeader("Cache-Control", "no-store")
        if (request.method !== "GET" || url.pathname !== redirect.pathname) {
            response.writeHead(404).end("Not found")
            return
        }
        if (url.searchParams.get("state") !== state) {
            response.writeHead(400).end("Invalid OAuth state. Return to OpenCode and retry login.")
            rejectCode(new Error("Spotify login state mismatch. Run /spotify-login again."))
            return
        }
        if (consumed) { response.writeHead(409).end("Callback already received"); return }
        consumed = true
        const code = url.searchParams.get("code")
        if (url.searchParams.has("error") || !code) {
            response.writeHead(400).end("Spotify authorization was not granted. Return to OpenCode.")
            rejectCode(new Error("Spotify authorization was denied. Run /spotify-login to try again."))
            return
        }
        response.end("Spotify authorization received. Return to OpenCode to finish connecting.")
        resolveCode(code)
    })
    const abort = () => rejectCode(new Error("Spotify login cancelled or timed out. Run /spotify-login to retry."))
    signal.addEventListener("abort", abort, { once: true })
    try {
        await new Promise((resolve, reject) => {
            server.once("error", reject)
            server.listen(Number(redirect.port || 80), redirect.hostname.replace(/[\[\]]/g, ""), resolve)
        })
        signal.throwIfAborted()
        const url = new URL("https://accounts.spotify.com/authorize")
        url.search = new URLSearchParams({ client_id: clientID, response_type: "code", redirect_uri: redirectURI, scope: scopes, state, show_dialog: "true" }).toString()
        await open(url.toString())
        return await callback
    } catch (error) {
        if (error.code === "EADDRINUSE") throw new Error(`Spotify callback port ${redirect.port || 80} is already in use. Close the other login flow and retry /spotify-login.`)
        throw error
    } finally {
        signal.removeEventListener("abort", abort)
        server.close()
        server.closeAllConnections()
    }
}
