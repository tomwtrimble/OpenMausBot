# Personal setup notes (fork of milind-soni/OpenMausBot)

Context saved from a Cursor chat on 2026-10-30 so work can resume on another computer.

## Goal

Run OpenMausBot (MausBot) for personal use and control it from an iPhone. This fork is a personal copy on GitHub, separate from any work (Trimble Access) projects. The intent is to use the app, not to develop it.

## Repos

- Fork (origin): https://github.com/tomwtrimble/OpenMausBot
- Upstream: https://github.com/milind-soni/OpenMausBot
- Local clone on the first computer: `~/Documents/Cursor/OpenMausBot`

## What OpenMausBot is

- A messenger-style desktop app (Electron) where each bot is a separate agent with its own model, computer and connected apps.
- Bots run on the `claude`, `codex` or `grok` CLIs, or the Cursor Agent CLI (`cursor-agent`), using your existing logins.
- Local-first: data lives in `~/.openmausbot`. Risky actions arrive as Allow / Deny approval cards.
- Not affiliated with xAI, Meta, OpenAI or Manus. It has no crypto token.
- Cursor (the IDE and its agent) is not the MausBot UI. They are separate tools.

## Constraints found

- The first computer restricts what can be downloaded or installed, which is why the code is kept in Git.
- Decision: download the `.dmg` on a different Mac and use that as the host.

## Plan (on the other Mac)

1. Download the `.dmg` from https://github.com/milind-soni/OpenMausBot/releases/latest (Apple silicon or Intel).
2. Install the Cursor CLI and sign in, or use Claude Code instead:

   ```sh
   curl https://cursor.com/install -fsS | bash
   cursor-agent login
   ```

3. In the app: App settings, Agent engines, Refresh engines. Create a bot and pick the Cursor engine. See `docs/cursor.md`.
4. Install the iPhone app "MausBot: Private AI Agents" (App Store id 6803387923), published by Supamaus Software Private Limited. The desktop menu "Get the phone app" shows the official QR.
5. Pair the phone. Options:
   - MausBot Cloud (paid, chosen preference): desktop menu, "Connect your phone to your Cloud (always on)", then "Create pairing code" and scan it in the phone app. See `docs/ios-companion.md`.
   - Free alternatives: Settings, Remote access, using Tailscale or the managed HTTPS address.
6. If the host Mac is paired directly (not through Cloud), it must stay on, awake and running the app.

## Open questions

- Whether bots in MausBot Cloud can use a local Cursor login.
- Whether the Cloud pairing flow works without installing the desktop app on a restricted machine.
- The Cursor engine's live smoke test is documented as not yet run on a real signed-in machine, so expect rough edges. Claude Code is the fallback.

## Alternatives considered

- VPS or always-on server with `openmausbot serve --tunnel` or `--tailscale`. See `docs/deploy-vps.md` and `docs/self-hosting.md`.
- GitHub Codespaces on the fork. It sleeps when idle, so it suits trials only.
- Running from source (`pnpm install`, `pnpm dev:server`, `pnpm dev`, `pnpm dev:desktop`). Not needed for plain use.
- Cursor cloud agents and Cursor for iOS control repos. They cannot host MausBot.
