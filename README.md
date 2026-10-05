# 拉伸换边计时器

[English](./README.en.md)

通过"循环分段倒计时 + 换边提醒"解决拉伸、筋膜枪放松时左右换边计时问题的可爱 App：按单边时长循环倒计时，每段结束响铃提醒换边，自动进入下一段，直到总时长跑完；陪伴小动物（🐶🐰🐱）随计时状态联动。

## 技术栈

- Expo SDK 57 + TypeScript（React Native）
- React Navigation（Bottom Tabs，3 页）
- AsyncStorage 本地持久化（设置 + 历史记录）
- expo-audio 播放内置音效（8 换边音 + 9 背景音：5 环境音 + 4 轻音乐，Incompetech CC BY 4.0 署名素材）
- 界面多语言（自建 i18n 层，无第三方 i18n 库）：中文 / English，设置页可切「跟随系统 / 中文 / English」，切换即时生效不重启；`expo-localization` 读系统语言

## 目录结构

```text
RNApp/                  # Expo 工程（App 本体）
├── App.tsx             # 入口：Providers（Settings/I18n/History）+ NavigationContainer + Tabs
├── app.json            # 版本号真源 + plugins（withAndroidAppLocales、expo-localization）
├── plugins/
│   └── withAndroidAppLocales.js   # Expo config plugin：prebuild 后生成 res/values-en/strings.xml
└── src/
    ├── i18n/           # 多语言层：strings.zh.ts（key 真源）/ strings.en.ts / index.tsx（LANGUAGES + I18nProvider + useT）
    ├── navigation/     # BottomTabs 定义
    ├── screens/        # TimerScreen / SettingsScreen / HistoryScreen
    ├── components/     # Pet（小动物）/ PromptBanner
    ├── timer/          # useTimer 计时状态机（endAt 时间戳校正）
    ├── store/          # SettingsContext / HistoryContext（AsyncStorage 持久化）
    ├── sounds/         # 音效播放封装（expo-audio）
    ├── theme/          # themes.ts（4 套色板 token）+ useTheme.ts（取色 hook）
    └── constants.ts    # 时长/音效/动物等选项常量

docs/
├── handoff/HANDOFF.md  # 交接文档（恢复开发先读我）
├── roles/              # 角色卡（ORCA 体系）
├── pm/  qa/  review/   # 计划 / 验收 / 评审模板与产出
├── model/              # 任务账本 TASK-MODEL-LOG.jsonl + 逐派账本 DISPATCH-LOG.jsonl
├── sop/                # 基础设施规范（android / docker / supabase / sqlite / webqa / decision-router）
├── prompts/            # 编排者与总监督提示词
└── templates/
scripts/
├── model/check-ledger.mjs   # 账本校验（LEDGER-OK）
└── decision/                # Decision Sidecar（advisory only）
constitution.md  spec.md  plan.md  data-model.md  tasks.md   # SDD 五份文档（V1.8）
经验一句话.md             # 经验沉淀
第七周文稿/                # 课程讲义 + 本周作业说明（与 App 无关）
```

## 运行（本地开发）

```bash
cd RNApp
npx expo start --port 8082     # 启动 Metro
# 手机（同一 WiFi）装 Expo Go → 手动输入 exp://<电脑IP>:8082
```

## 打包 APK（本地构建）

```bash
cd RNApp
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
npx eas build --platform android --profile preview --local   # 本地产出 APK（非云端）
```
- 版本号读 `app.json`（`eas.json` 的 `appVersionSource` 已设为 local）；发版须递增 `version` 与 `versionCode`。
- 构建产物归档到 `artifacts/`，记录版本号与 SHA-256。
- **验收一律用 `eas build --local` 的产物**：config plugin（`values-en` 英文桌面图标名）只在 prebuild 阶段生效，本地直构 `npx expo run:android` 不跑 prebuild、拿不到该资源。
- 验证英文系统级文案是否进包用 `aapt2 dump resources`（看 `() 中文 / (en) 英文`）或 `aapt dump badging`（看 `application-label-en`）；`unzip` 查 `res/values-en` 对 string 资源无效。

- 应用标识：name「拉伸换边计时器」、slug `stretch-side-timer`、android package `com.stretch.sidetimer`
- `eas.json` preview 档位 = APK（不签 store，直接安装）

## 当前状态

- 第一版全部功能已实现并通过 Android 真机验收；详细进展见 [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
- **多主题风格**：4 套主题（暖萌/科技/极简/杂志），设置页可选，全局套用
- **音效系统**：8 种换边音 + 9 种背景音（5 环境音 + 4 轻音乐，Incompetech CC BY 4.0 署名）
- **界面多语言**：设置页「跟随系统 / 中文 / English」三项，「跟随系统」排第一且为新装默认；切换即时生效不重启；加新语言 = 新建 `src/i18n/strings.<code>.ts` + `LANGUAGES` 加一行，页面代码零改动；英文系统下桌面图标名为 `Stretch Timer`
- **最新 APK：V1.7.0**（versionCode 5，本地构建，已推两台红米真机）。归档与设备见 HANDOFF
- P2 锁屏计时精度：代码已实现（endAt 时间戳校正）
- 运行与打包命令见上文；详细交接见 [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
