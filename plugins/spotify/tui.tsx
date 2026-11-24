/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui"
import { createSignal, Show } from "solid-js"
import { SpotifyClient } from "./client.mjs"
import { execFile } from "node:child_process"

type Track = { name: string; uri: string; duration_ms: number; artists?: { name: string }[]; album?: { name: string }; show?: { name: string } }
type Playback = { is_playing: boolean; progress_ms: number; item: Track | null; device?: { name: string } }
type Device = { id: string; name: string; type: string; is_active: boolean }
const time = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`
const compact = (value: string) => Array.from(value).length > 32 ? `${Array.from(value).slice(0, 31).join("")}…` : value
const progressBar = (position: number, duration: number) => {
    const progress = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0
    const marker = Math.floor(progress * 11)
    return `${"─".repeat(marker)}●${"┈".repeat(11 - marker)}`
}

export default Plugin.define({
    id: "local.spotify",
    setup(api) {
        const spotify = new SpotifyClient()
        const [playback, setPlayback] = createSignal<Playback | null>(null)
        const [error, setError] = createSignal("")
        const [busy, setBusy] = createSignal(false)
        const [loggingIn, setLoggingIn] = createSignal(false)
        const [connected, setConnected] = createSignal(false)
        let disposed = false
        let refreshing: Promise<void> | undefined
        const refresh = () => {
            if (refreshing) return refreshing
            refreshing = (async () => {
                try {
                    const current = await spotify.current()
                    if (!disposed) { setPlayback(current); setError(""); setConnected(true) }
                } catch (cause) {
                    if (!disposed) setError(cause instanceof Error ? cause.message : "Spotify unavailable")
                }
            })().finally(() => { refreshing = undefined })
            return refreshing
        }
        const run = async (action: () => Promise<unknown>) => {
            if (busy() || disposed) return
            setBusy(true)
            try {
                await action()
                await refreshing
                if (!disposed) await refresh()
            } catch (cause) {
                if (!disposed) {
                    const message = cause instanceof Error ? cause.message : "Spotify request failed"
                    setError(message)
                    api.ui.toast.show({ title: "Spotify", message, variant: "error" })
                }
            } finally { if (!disposed) setBusy(false) }
        }
        const search = async (input?: string) => {
            const query = input?.trim() || await api.ui.dialog.prompt({ title: "Search Spotify", placeholder: "Track or artist" })
            if (!query?.trim() || disposed) return
            const tracks: Track[] = await spotify.search(query.trim())
            if (disposed) return
            if (!tracks.length) {
                api.ui.toast.show({ title: "Spotify", message: "No tracks found" })
                return
            }
            const uri = await api.ui.dialog.select({
                title: "Spotify — select a track to play",
                options: tracks.map((track) => ({ title: track.name, value: track.uri, description: `${track.artists?.map((artist) => artist.name).join(", ")} · ${track.album?.name ?? ""}` })),
            })
            if (uri && !disposed) await spotify.play(uri)
        }
        const login = async () => {
            setLoggingIn(true)
            try {
                await refreshing
                await spotify.login(async (url: string) => {
                    await new Promise<void>((resolve, reject) => {
                        const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "rundll32" : "xdg-open"
                        const args = process.platform === "win32" ? ["url.dll,FileProtocolHandler", url] : [url]
                        execFile(command, args, { timeout: 10000 }, (error) => error ? reject(new Error("Could not open your browser for Spotify login.")) : resolve())
                    })
                    if (!disposed) api.ui.toast.show({ title: "Spotify", message: "Authorize in your browser. Use /spotify-login-cancel to cancel.", duration: 10000 })
                })
                if (!disposed) {
                    setConnected(true)
                    api.ui.toast.show({ title: "Spotify", message: "Connected to Spotify", variant: "success" })
                }
            } finally { if (!disposed) setLoggingIn(false) }
        }
        const selectDevice = async () => {
            const devices: Device[] = await spotify.devices()
            if (disposed) return
            if (!devices.length) {
                api.ui.toast.show({ title: "Spotify", message: "No available players. Open Spotify on your computer or phone, then run /spotify-device again.", duration: 10000 })
                return
            }
            const deviceID = await api.ui.dialog.select({
                title: "Spotify — choose a device and start playback",
                current: devices.find((device) => device.is_active)?.id,
                options: devices.map((device) => ({ title: device.name, value: device.id, description: `${device.type}${device.is_active ? " · Active" : ""}` })),
            })
            if (deviceID && !disposed) await spotify.transfer(deviceID)
        }
        const togglePlayback = async () => {
            const current: Playback | null = await spotify.current()
            if (disposed) return
            await (current?.is_playing ? spotify.pause() : spotify.play())
        }
        const showQueue = async () => {
            const result = await spotify.queue()
            if (disposed) return
            const tracks: Track[] = result?.queue?.filter(Boolean) ?? []
            if (!tracks.length) {
                api.ui.toast.show({ title: "Spotify", message: "Your queue is empty" })
                return
            }
            await api.ui.dialog.select({
                title: "Spotify — upcoming queue",
                options: tracks.map((track, index) => ({
                    title: `${index + 1}. ${track.name}`,
                    value: index,
                    description: track.artists?.map((artist) => artist.name).join(", ") || track.show?.name || "",
                })),
            })
        }
        const showStatus = async () => {
            const current: Playback | null = await spotify.current()
            if (disposed) return
            setPlayback(current)
            await api.ui.dialog.alert({
                title: "Spotify — current track",
                message: current?.item ? [
                    `song: ${current.item.name}`,
                    `artist: ${current.item.artists?.map((artist) => artist.name).join(", ") || current.item.show?.name || ""}`,
                    `${current.is_playing ? "▶ Playing" : "❚❚ Paused"} · ${time(current.progress_ms ?? 0)} / ${time(current.item.duration_ms)}`,
                    `device: ${current.device?.name ?? "None"}`,
                ].join("\n") : "Nothing playing",
            })
        }
        const actions = [
            { name: "spotify-toggle", title: "Toggle Spotify playback", action: togglePlayback, bind: "<leader>mt" },
            { name: "spotify-queue", title: "Show Spotify queue", action: showQueue, bind: "<leader>ml" },
            { name: "spotify-status", title: "Show current Spotify track", action: showStatus, bind: "<leader>mm" },
            { name: "spotify-device", title: "Choose playback device and play", action: selectDevice, bind: "<leader>md" },
            { name: "spotify-login", title: "Sign in to Spotify", action: login },
            { name: "spotify", title: "Search and play music", action: search, arguments: true, bind: "<leader>ms" },
            { name: "spotify-play", title: "Resume playback", action: () => spotify.play() },
            { name: "spotify-next", title: "Skip track", action: () => spotify.next(), bind: "<leader>mn" },
            { name: "spotify-previous", title: "Previous track", action: () => spotify.previous(), bind: "<leader>mp" },
            { name: "spotify-pause", title: "Pause playback", action: () => spotify.pause() },
            { name: "spotify-stop", title: "Stop (pause and rewind)", action: () => spotify.stop() },
        ]
        api.keymap.layer(() => ({
            mode: "global",
            commands: [...actions.map((action) => ({
                id: `local.${action.name}`, title: action.title, group: "Spotify", palette: true,
                bind: action.bind,
                slash: { name: action.name, arguments: action.arguments },
                enabled: () => !busy(),
                run: (input?: string) => run(() => action.action(input)),
            })), {
                id: "local.spotify-login-cancel", title: "Cancel Spotify login", group: "Spotify", palette: true,
                slash: { name: "spotify-login-cancel" }, enabled: () => loggingIn(), run: () => spotify.cancelLogin(),
            }],
            bindings: actions.filter((action) => action.bind).map((action) => `local.${action.name}`),
        }))
        const remove = api.ui.slot({
            append: "sidebar.content",
            render: () => (
                <box flexDirection="column" marginTop={1}>
                    <box flexDirection="row" justifyContent="space-between">
                        <text fg={api.theme.text.base}>Spotify</text>
                        <box flexDirection="row" gap={2}>
                            <text fg={api.theme.text.muted} onMouseUp={() => void run(selectDevice)}>🔈</text>
                            <text fg={api.theme.text.muted} onMouseUp={() => void run(() => search())}>⌕ Search</text>
                        </box>
                    </box>
                    <Show when={error()}><text fg={api.theme.text.feedback.error.base}>{error()}</text></Show>
                    <Show when={loggingIn() || (!connected() && error())}>
                        <text fg={api.theme.text.muted} onMouseUp={() => loggingIn() ? spotify.cancelLogin() : void run(login)}>{loggingIn() ? "[Cancel login] Waiting for browser…" : "[Sign in]"}</text>
                    </Show>
                    <Show when={playback()?.item} fallback={<text fg={api.theme.text.muted}>Nothing playing</text>}>
                        <text fg={api.theme.text.base}>song: {compact(playback()?.item?.name ?? "")}</text>
                        <text fg={api.theme.text.muted}>artist: {compact(playback()?.item?.artists?.map((artist) => artist.name).join(", ") || playback()?.item?.show?.name || "")}</text>
                        <box flexDirection="row" gap={1}>
                            <text fg={api.theme.text.feedback.info.base}>{progressBar(playback()?.progress_ms ?? 0, playback()?.item?.duration_ms ?? 0)}</text>
                            <text fg={api.theme.text.muted}>{time(playback()?.progress_ms ?? 0)} / {time(playback()?.item?.duration_ms ?? 0)}</text>
                        </box>
                    </Show>
                    <box flexDirection="row" gap={2} marginTop={1}>
                        <text fg={api.theme.text.base} onMouseUp={() => void run(() => spotify.previous())}> ⏮ </text>
                        <text fg={api.theme.text.feedback.info.base} onMouseUp={() => void run(() => playback()?.is_playing ? spotify.pause() : spotify.play())}>{playback()?.is_playing ? " ❚❚ " : " ▶ "}</text>
                        <text fg={api.theme.text.base} onMouseUp={() => void run(() => spotify.next())}> ⏭ </text>
                        <text fg={api.theme.text.muted} onMouseUp={() => void run(() => spotify.stop())}> ⏹ </text>
                        <Show when={busy()}><text fg={api.theme.text.muted}>…</text></Show>
                    </box>
                </box>
            ),
        })
        void refresh()
        const interval = setInterval(() => { if (!busy()) void refresh() }, 5000)
        return () => { disposed = true; clearInterval(interval); spotify.close(); remove() }
    },
})
