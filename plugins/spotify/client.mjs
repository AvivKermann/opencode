import { readFile, writeFile, rename, unlink } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { authorize } from "./oauth.mjs"

export class SpotifyClient {
    constructor(cachePath = "/tmp/.spotify_cache") {
        this.cachePath = cachePath
        this.pendingToken = undefined
        this.retryAt = 0
        this.controller = new AbortController()
    }
    close() { this.controller.abort() }
    cancelLogin() { this.loginController?.abort() }
    async login(open) {
        if (this.loginController) throw new Error("Spotify login already in progress.")
        const controller = new AbortController()
        this.loginController = controller
        try {
            await this.pendingToken?.catch(() => {})
            const { id, secret } = this.credentials()
            const redirectURI = process.env.SPOTIFY_REDIRECT_URI || process.env.SPOTIPY_REDIRECT_URI
            if (!redirectURI) throw new Error("Missing SPOTIFY_REDIRECT_URI in OpenCode's environment.")
            const signal = AbortSignal.any([controller.signal, this.controller.signal, AbortSignal.timeout(180000)])
            const code = await authorize({ clientID: id, redirectURI, signal, open })
            const fresh = await this.exchange({ grant_type: "authorization_code", code, redirect_uri: redirectURI }, id, secret, signal)
            if (!fresh.refresh_token) throw new Error("Spotify returned no refresh token. Run /spotify-login again.")
            await this.saveToken(fresh)
        } finally { this.loginController = undefined }
    }
    credentials() {
        const id = process.env.SPOTIFY_CLIENT_ID || process.env.SPOTIPY_CLIENT_ID
        const secret = process.env.SPOTIFY_CLIENT_SECRET || process.env.SPOTIPY_CLIENT_SECRET
        if (!id || !secret) throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in OpenCode's environment.")
        return { id, secret }
    }
    async token(force = false) {
        if (this.pendingToken) return this.pendingToken
        this.pendingToken = this.loadToken(force).finally(() => { this.pendingToken = undefined })
        return this.pendingToken
    }
    async loadToken(force) {
        let cached
        try { cached = JSON.parse(await readFile(this.cachePath, "utf8")) }
        catch { throw new Error("Spotify is not connected. Run /spotify-login to sign in.") }
        if (!force && cached.access_token && cached.expires_at > Date.now() / 1000 + 60) return cached.access_token
        const { id, secret } = this.credentials()
        if (!cached.refresh_token) throw new Error("Spotify refresh token is missing. Run /spotify-login.")
        const fresh = await this.exchange({ grant_type: "refresh_token", refresh_token: cached.refresh_token }, id, secret, this.controller.signal)
        return this.saveToken({ ...cached, ...fresh, refresh_token: fresh.refresh_token || cached.refresh_token })
    }
    async exchange(body, id, secret, signal) {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(body),
            signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
        })
        if (!response.ok) {
            const failure = await response.json().catch(() => ({}))
            if (failure.error === "invalid_grant") throw new Error("Spotify authorization expired or was revoked. Run /spotify-login.")
            if (failure.error === "invalid_client") throw new Error("Spotify rejected the app credentials. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.")
            throw new Error(`Spotify authentication failed (${response.status}). Run /spotify-login.`)
        }
        const fresh = await response.json()
        if (!fresh.access_token || !Number.isFinite(fresh.expires_in)) throw new Error("Invalid Spotify token response.")
        return fresh
    }
    async saveToken(fresh) {
        const token = { ...fresh, expires_at: Math.floor(Date.now() / 1000) + fresh.expires_in }
        const temporary = `${this.cachePath}.${randomUUID()}`
        try {
            await writeFile(temporary, JSON.stringify(token), { mode: 0o600, flag: "wx" })
            await rename(temporary, this.cachePath)
        } finally { await unlink(temporary).catch(() => {}) }
        return token.access_token
    }
    async request(path, method = "GET", body, retry = true) {
        if (Date.now() < this.retryAt) throw new Error("Spotify rate limited; waiting before retrying.")
        const token = await this.token()
        const response = await fetch(`https://api.spotify.com/v1${path}`, {
            method,
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(15000)]),
        })
        if (response.status === 401 && retry) {
            await this.token(true)
            return this.request(path, method, body, false)
        }
        if (response.status === 429) {
            const seconds = Number(response.headers.get("retry-after") || 30)
            this.retryAt = Date.now() + (Number.isFinite(seconds) ? Math.max(1, seconds) : 30) * 1000
            throw new Error("Spotify rate limited; waiting before retrying.")
        }
        if (response.status === 401) throw new Error("Spotify authorization was rejected. Run /spotify-login.")
        if (response.status === 403) throw new Error("Spotify denied access. Check Premium/app access, or run /spotify-login to grant playback permissions.")
        if (response.status === 404) throw new Error("No active Spotify device. Run /spotify-device to select a player and start playback.")
        if (!response.ok) throw new Error(`Spotify request failed (${response.status}).`)
        if (response.status === 204 || method !== "GET") return null
        return response.json()
    }
    current() { return this.request("/me/player") }
    queue() { return this.request("/me/player/queue") }
    async devices() {
        const result = await this.request("/me/player/devices")
        return (result?.devices ?? []).filter((device) => device.id && !device.is_restricted)
    }
    transfer(deviceID) {
        return this.request("/me/player", "PUT", { device_ids: [deviceID], play: true })
    }
    async search(query) {
        const result = await this.request(`/search?${new URLSearchParams({ q: query, type: "track", limit: "10" })}`)
        return result?.tracks?.items?.filter(Boolean) ?? []
    }
    play(uri) { return this.request("/me/player/play", "PUT", uri ? { uris: [uri] } : undefined) }
    pause() { return this.request("/me/player/pause", "PUT") }
    next() { return this.request("/me/player/next", "POST") }
    previous() { return this.request("/me/player/previous", "POST") }
    async stop() {
        await this.pause()
        await this.request("/me/player/seek?position_ms=0", "PUT")
    }
}
