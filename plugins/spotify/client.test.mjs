import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { SpotifyClient } from "./client.mjs"
import { createServer } from "node:net"

async function fixture(t, handler, expired = false) {
    const directory = await mkdtemp(join(tmpdir(), "spotify-test-"))
    const path = join(directory, "cache")
    await writeFile(path, JSON.stringify({ access_token: "old", refresh_token: "refresh", expires_at: expired ? 0 : Date.now() / 1000 + 3600, scope: "user-read-playback-state" }))
    t.mock.method(globalThis, "fetch", handler)
    const client = new SpotifyClient(path)
    t.after(async () => { client.close(); await rm(directory, { recursive: true, force: true }) })
    return { client, path }
}

test("refreshes a rejected token, preserves the shared Spotipy cache, and retries playback", async (t) => {
    const originalID = process.env.SPOTIFY_CLIENT_ID
    const originalSecret = process.env.SPOTIFY_CLIENT_SECRET
    process.env.SPOTIFY_CLIENT_ID = "test-id"
    process.env.SPOTIFY_CLIENT_SECRET = "test-secret"
    t.after(() => {
        if (originalID === undefined) delete process.env.SPOTIFY_CLIENT_ID; else process.env.SPOTIFY_CLIENT_ID = originalID
        if (originalSecret === undefined) delete process.env.SPOTIFY_CLIENT_SECRET; else process.env.SPOTIFY_CLIENT_SECRET = originalSecret
    })
    const { client, path } = await fixture(t, async (url, options) => {
        if (url.includes("/api/token")) {
            assert.equal(options.body.get("refresh_token"), "refresh")
            return Response.json({ access_token: "new", expires_in: 3600 })
        }
        if (options.headers.Authorization === "Bearer old") return new Response(null, { status: 401 })
        assert.equal(options.headers.Authorization, "Bearer new")
        return Response.json({ is_playing: true })
    })
    assert.deepEqual(await client.current(), { is_playing: true })
    const cache = JSON.parse(await readFile(path, "utf8"))
    assert.equal(cache.refresh_token, "refresh")
    assert.equal(cache.scope, "user-read-playback-state")
    assert.ok(cache.expires_at > Date.now() / 1000)
})

test("stop pauses before rewinding and does not rewind if pause fails", async (t) => {
    const calls = []
    let fail = false
    const { client } = await fixture(t, async (url, options) => {
        calls.push([new URL(url).pathname, options.method, new URL(url).search])
        return new Response(null, { status: fail ? 404 : 204 })
    })
    await client.stop()
    assert.deepEqual(calls, [["/v1/me/player/pause", "PUT", ""], ["/v1/me/player/seek", "PUT", "?position_ms=0"]])
    calls.length = 0
    fail = true
    await assert.rejects(client.stop(), /No active Spotify device/)
    assert.equal(calls.length, 1)
})

test("device selection excludes uncontrollable players and transfers with playback enabled", async (t) => {
    const { client } = await fixture(t, async (url, options) => {
        if (options.method === "GET") {
            assert.equal(new URL(url).pathname, "/v1/me/player/devices")
            return Response.json({ devices: [
                { id: "computer", name: "Computer", is_restricted: false, is_active: false },
                { id: null, name: "Unavailable" },
                { id: "restricted", is_restricted: true },
            ] })
        }
        assert.equal(new URL(url).pathname, "/v1/me/player")
        assert.equal(options.method, "PUT")
        assert.deepEqual(JSON.parse(options.body), { device_ids: ["computer"], play: true })
        return new Response(null, { status: 204 })
    })
    const devices = await client.devices()
    assert.deepEqual(devices.map((device) => device.id), ["computer"])
    await client.transfer(devices[0].id)
})

test("search encodes user text; rate limiting blocks subsequent API requests", async (t) => {
    let calls = 0
    const { client } = await fixture(t, async (url) => {
        calls++
        assert.equal(new URL(url).searchParams.get("q"), "AC/DC & live")
        if (calls === 1) return Response.json({ tracks: { items: [null, { name: "Track", uri: "spotify:track:1" }] } })
        return new Response(null, { status: 429, headers: { "retry-after": "60" } })
    })
    assert.deepEqual(await client.search("AC/DC & live"), [{ name: "Track", uri: "spotify:track:1" }])
    await assert.rejects(client.search("AC/DC & live"), /rate limited/)
    await assert.rejects(client.current(), /rate limited/)
    assert.equal(calls, 2)
})

for (const outcome of ["success", "denied", "wrong-state", "cancelled"]) {
    test(`standalone browser login: ${outcome}, with callback listener cleanup`, async (t) => {
        const listener = createServer()
        await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve))
        const port = listener.address().port
        await new Promise((resolve) => listener.close(resolve))
        const redirect = `http://127.0.0.1:${port}/callback`
        const variables = { SPOTIFY_CLIENT_ID: "test-id", SPOTIFY_CLIENT_SECRET: "test-secret", SPOTIFY_REDIRECT_URI: redirect }
        const previous = Object.fromEntries(Object.keys(variables).map((name) => [name, process.env[name]]))
        Object.assign(process.env, variables)
        t.after(() => {
            for (const [name, value] of Object.entries(previous)) {
                if (value === undefined) delete process.env[name]
                else process.env[name] = value
            }
        })
        const realFetch = globalThis.fetch
        let exchanged = 0
        const { client, path } = await fixture(t, async (url, options) => {
            if (String(url).startsWith("http://127.0.0.1:")) return realFetch(url, options)
            exchanged++
            assert.equal(url, "https://accounts.spotify.com/api/token")
            assert.equal(options.body.get("grant_type"), "authorization_code")
            assert.equal(options.body.get("redirect_uri"), redirect)
            assert.equal(options.body.get("code"), "browser-code")
            assert.equal(options.headers.Authorization, `Basic ${Buffer.from("test-id:test-secret").toString("base64")}`)
            return Response.json({ access_token: "standalone", refresh_token: "new-refresh", expires_in: 3600 })
        })
        await rm(path)
        const login = client.login(async (url) => {
            const authorization = new URL(url)
            assert.equal(authorization.origin, "https://accounts.spotify.com")
            assert.equal(authorization.searchParams.get("client_id"), "test-id")
            assert.ok(authorization.searchParams.get("scope").includes("user-modify-playback-state"))
            if (outcome === "cancelled") { client.cancelLogin(); return }
            const callback = new URL(authorization.searchParams.get("redirect_uri"))
            callback.searchParams.set("state", outcome === "wrong-state" ? "wrong" : authorization.searchParams.get("state"))
            callback.searchParams.set(outcome === "denied" ? "error" : "code", outcome === "denied" ? "access_denied" : "browser-code")
            const response = await realFetch(callback)
            assert.equal(response.status, outcome === "success" ? 200 : 400)
            await response.text()
        })
        if (outcome === "success") {
            await login
            const cache = JSON.parse(await readFile(path, "utf8"))
            assert.equal(cache.access_token, "standalone")
            assert.equal(cache.refresh_token, "new-refresh")
            assert.equal(exchanged, 1)
        } else {
            await assert.rejects(login, outcome === "denied" ? /denied/ : outcome === "wrong-state" ? /state mismatch/ : /cancelled/)
            assert.equal(exchanged, 0)
            await assert.rejects(readFile(path), { code: "ENOENT" })
        }
        const rebound = createServer()
        await new Promise((resolve, reject) => { rebound.once("error", reject); rebound.listen(port, "127.0.0.1", resolve) })
        await new Promise((resolve) => rebound.close(resolve))
    })
}
