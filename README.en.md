# Stretch Side Timer（拉伸换边计时器）

[简体中文](./README.md) | English

> A small Android app that settles the "which side am I on" problem while you stretch or use a massage gun. It counts down in repeated segments sized to one side, rings when each segment ends so you switch sides, starts the next segment on its own, and stops when the total time is up. A companion pet (dog, rabbit, or cat) reacts to what the timer is doing.

## Tech stack

- Expo SDK 57 + TypeScript (React Native)
- React Navigation (bottom tabs, 3 pages)
- AsyncStorage for local persistence (settings plus history)
- expo-audio for the built-in sounds: 8 side-switch cues + 9 background tracks (5 ambient + 4 light instrumental), material from Incompetech under CC BY 4.0 attribution
- Multilingual UI through an i18n layer written in-project (no third-party i18n library): 中文 / English, selectable on the settings page as "follow the system / 中文 / English", with switching that takes effect immediately and needs no restart. `expo-localization` reads the system language.

## Directory structure

```text
RNApp/                  # the Expo project (the app itself)
├── App.tsx             # entry: providers (Settings/I18n/History) + NavigationContainer + Tabs
├── app.json            # version source of truth + plugins (withAndroidAppLocales, expo-localization)
├── plugins/
│   └── withAndroidAppLocales.js   # Expo config plugin: generates res/values-en/strings.xml after prebuild
└── src/
    ├── i18n/           # language layer: strings.zh.ts (key source of truth) / strings.en.ts / index.tsx (LANGUAGES + I18nProvider + useT)
    ├── navigation/     # BottomTabs definition
    ├── screens/        # TimerScreen / SettingsScreen / HistoryScreen
    ├── components/     # Pet (companion animal) / PromptBanner
    ├── timer/          # useTimer state machine (endAt timestamp correction)
    ├── store/          # SettingsContext / HistoryContext (AsyncStorage persistence)
    ├── sounds/         # audio playback wrapper (expo-audio)
    ├── theme/          # themes.ts (4 palettes of design tokens) + useTheme.ts (color lookup hook)
    └── constants.ts    # constants for durations, sounds, and animals

docs/
├── handoff/HANDOFF.md  # handoff document (read this first to resume development)
├── roles/              # role cards (ORCA system)
├── pm/  qa/  review/   # planning / acceptance / review templates and outputs
├── model/              # task ledger TASK-MODEL-LOG.jsonl + dispatch ledger DISPATCH-LOG.jsonl
├── sop/                # infrastructure standards (android / docker / supabase / sqlite / webqa / decision-router)
├── prompts/            # orchestrator and supervisor prompts
└── templates/
scripts/
├── model/check-ledger.mjs   # ledger validation (LEDGER-OK)
└── decision/                # Decision Sidecar (advisory only)
constitution.md  spec.md  plan.md  data-model.md  tasks.md   # the five SDD documents (V1.8)
经验一句话.md             # accumulated lessons
第七周文稿/                # course handouts + this week's assignment notes (unrelated to the app)
```

## Quick start (local development)

```bash
cd RNApp
npx expo start --port 8082     # start Metro
# on the phone (same Wi-Fi) install Expo Go, then enter exp://<your computer's IP>:8082 by hand
```

## Building the APK (local build)

```bash
cd RNApp
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
npx eas build --platform android --profile preview --local   # produces the APK locally, not in the cloud
```

- The version number is read from `app.json` (`appVersionSource` in `eas.json` is set to local). Every release has to increment both `version` and `versionCode`.
- Build artifacts are archived in `artifacts/`, recording the version number and the SHA-256.
- **Acceptance always uses the output of `eas build --local`**: the config plugin (the `values-en` English desktop icon label) only takes effect during the prebuild stage, and a direct local build with `npx expo run:android` does not run prebuild, so that resource is missing.
- To confirm that English system-level strings actually made it into the package, use `aapt2 dump resources` (look for `() 中文 / (en) 英文`) or `aapt dump badging` (look for `application-label-en`). Checking `res/values-en` with `unzip` does not work for string resources.

- App identifiers: name `拉伸换边计时器`, slug `stretch-side-timer`, Android package `com.stretch.sidetimer`
- The `preview` profile in `eas.json` produces an APK (not store-signed, installed directly)

## Current status

- All first-version features are implemented and passed acceptance on a real Android device; detailed progress is in [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
- **Multiple themes**: 4 themes (warm-cute / tech / minimal / magazine), selectable on the settings page and applied throughout the app
- **Sound system**: 8 side-switch cues + 9 background tracks (5 ambient + 4 light instrumental, Incompetech CC BY 4.0 attribution)
- **Multilingual UI**: the settings page offers "follow the system / 中文 / English", with "follow the system" listed first and set as the default on a fresh install; switching takes effect immediately without a restart; adding a language means creating `src/i18n/strings.<code>.ts` and adding one line to `LANGUAGES`, with zero changes to page code. On an English system the desktop icon reads `Stretch Timer`.
- **Latest APK: V1.7.0** (versionCode 5, built locally, pushed to two Redmi phones). The archive and device list are in HANDOFF.
- P2 lock-screen timing accuracy: implemented in code (endAt timestamp correction)
- Run and packaging commands are above; the detailed handoff is in [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
