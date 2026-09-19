# 拉伸换边计时器

通过"循环分段倒计时 + 换边提醒"解决拉伸、筋膜枪放松时左右换边计时问题的可爱 App：按单边时长循环倒计时，每段结束响铃提醒换边，自动进入下一段，直到总时长跑完；陪伴小动物（🐶🐰🐱）随计时状态联动。

## 技术栈

- Expo SDK 57 + TypeScript（React Native）
- React Navigation（Bottom Tabs，3 页）
- AsyncStorage 本地持久化（设置 + 历史记录）
- expo-audio 播放内置音效（8 换边音 + 9 背景音：5 环境音 + 4 轻音乐，Incompetech CC BY 4.0 署名素材）

## 目录结构

```text
RNApp/                  # Expo 工程（App 本体）
├── App.tsx             # 入口：SafeAreaProvider + NavigationContainer + Tabs
└── src/
    ├── navigation/     # BottomTabs 定义
    ├── screens/        # TimerScreen / SettingsScreen / HistoryScreen
    ├── components/     # Pet（小动物）/ CountdownRing / PromptBanner
    ├── timer/          # useTimer 计时状态机（endAt 时间戳校正）
    ├── store/          # SettingsContext / HistoryContext（AsyncStorage 持久化）
    ├── sounds/         # 音效播放封装（expo-audio）
    ├── theme/          # themes.ts（4 套色板 token）+ useTheme.ts（取色 hook）
    └── constants.ts    # 时长/音效/动物等选项常量

docs/
├── handoff/HANDOFF.md  # 交接文档（恢复开发先读我）
├── roles/  pm/  qa/  review/   # 角色卡与模板（ORCA 体系）
constitution.md  spec.md  plan.md  data-model.md  tasks.md   # SDD 五份文档（V1.6）
经验一句话.md             # 经验沉淀
第七周文稿/                # 课程讲义 + 本周作业说明
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

- 应用标识：name「拉伸换边计时器」、slug `stretch-side-timer`、android package `com.stretch.sidetimer`
- `eas.json` preview 档位 = APK（不签 store，直接安装）

## 当前状态

- 第一版全部功能已实现并通过 Android 真机验收；详细进展见 [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
- **多主题风格**：4 套主题（暖萌/科技/极简/杂志），设置页可选，全局套用
- **音效系统**：8 种换边音 + 9 种背景音（5 环境音 + 4 轻音乐，Incompetech CC BY 4.0 署名）
- **最新 APK：V1.5.1**（versionCode 3，本地构建，已推三台红米真机）。归档与设备见 HANDOFF
- P2 锁屏计时精度：代码已实现（endAt 时间戳校正）
- 运行与打包命令见上文；详细交接见 [docs/handoff/HANDOFF.md](docs/handoff/HANDOFF.md)
