# HANDOFF｜交接

- Captured at：2026-09-27
- PROJECT_PHASE：DEVELOP（T13 多语言已完成并通过真机验收，链条待收尾派经验/neat）
- DEV_BASELINE：SDD **四份**带版本文档 V1.7（`spec.md` / `plan.md` / `data-model.md` / `tasks.md`）；另 `constitution.md` 为长期原则底线、无版本号，DEV 期间不随 SDD 升版
- Stage ID：TASK-2-MVP / T13-多语言
- 当前状态：2026-09-27 完成 F8 界面多语言（中文/英文），本地构建 V1.6.0（versionCode 4）并推送两台真机。CHANGE_REQUEST: B（新增 F8 功能，用户已拍板架构「方案 A RN i18n 层」+ 翻译口径；属局部功能变化，更新局部 Requirement/DoD 后留 DEVELOP，未召 Sol Planner）

## 零、T13 界面多语言（F8，2026-09-27，已完成）

- 需求：老外可在设置里切 English，整个 App 所有可见文字立即变英文、不重启 App；同时把多语言结构对开。
- **技术路线纠偏（重要）**：用户最初给的 `values/strings.xml` + `values-en` + DataStore + Activity recreate 是原生 Android 做法；本项目是 Expo/React Native（RN 0.86 / Expo 57），RN 界面文字**不经过 `res/values`**，原生方案在 App 内无效。改为 RN 侧 i18n 层：`RNApp/src/i18n/`（`strings.zh.ts` 为 key 唯一来源、`strings.en.ts` 标 `Record<StringKey, string>` 漏翻即 tsc 报错、`index.tsx` 出 `LANGUAGES` + `I18nProvider` + `useT()`）；语言存 `@stretch/settings` 的 `language` 字段（默认 zh，**不进模式快照**），`App.tsx` 顶层包 `I18nProvider`，切换只触发重渲染、不 remount。
- **加第三语言 = 一个文件 + 一行**：新建 `src/i18n/strings.<code>.ts`（完整 `Record<StringKey, string>`）+ `LANGUAGES` 加一行 `{ code, label, strings }`；`LanguageCode` 由表推导自动扩展，设置页选项 `LANGUAGES.map` 自动出现，页面代码零改动。
- 翻译口径：静态界面文字全译；4 首轻音乐保留英文原曲名 + 中文注解（`Senbazuru (禅意古筝)` 等，CC BY 4.0 署名不删减）；音效名/动物名/主题名/时长档位按界面语言译。
- **踩坑 P1（已修）**：builder 手写的 `android/app/src/main/res/values-en/strings.xml` **没进 APK** —— `eas build --local` 会在临时目录重跑 prebuild 冲掉手写 res。后果是英文系统下桌面图标名 fallback 中文。修法：新增 `RNApp/plugins/withAndroidAppLocales.js`（`withDangerousMod` 在 prebuild 后写 values-en/strings.xml），`app.json` plugins 加 `"./plugins/withAndroidAppLocales"`。**验证判据用 aapt/aapt2**（`aapt2 dump resources` 看 `() 中文 / (en) 英文`；`aapt dump badging` 看 `application-label-en:'Stretch Timer'`）；`unzip -l | grep values-en` 对 string 资源**天然无效**（string 编译进 resources.arsc 且 res/ 路径混淆），别再拿它当判据。
- 真机验收（第一台 IN9LZTAYV4UGU4JF / 22041216UC，目视逐条过）：中文界面正常且存量数据完整 → 设置页切 English 后三页 + 底部导航 + 模式模板英文形态（`T10 S60 A3`）立即全英文、无重启无闪白屏无溢出 → 强杀重开仍英文（持久化 OK）→ 计时进行中（00:49 / 第 1/10 边）切回中文，计时未中断未归零 → 测试计时未完成整边（completedSides=0）故未写入历史，**未污染真实数据**。
- 残留风险：第二台（indq5xfi6hovay4d）安装成功、dumpsys 校验 1.6.0/code 4，但该机屏幕全黑无法出图（`mWakefulness=Awake` 而截图最大亮度 0，设备侧问题，非 App 缺陷），**该台目视验收待屏幕恢复后补看**。
- 已知小瑕疵（未修，英文观感 P2）：历史记录页英文显示 `1 sides`（单复数未处理，`history.rowDesc` 文案模板硬写 `sides`）。目视：英文历史记录页 Delete/Clear 等表头与操作标签正常，仅 `1 sides` 单复数未处理。
- 产物：`artifacts/拉伸换边计时器丨V1.6丨多语言丨APK丨本地构建.apk`，92516870 字节，SHA-256 `05770ddb5087f12f54d8a6c2678da67d082b32342eb1a6e9fe14c3d3cf0b3938`，versionName 1.6.0 / versionCode 4，`aapt dump badging` 确认默认中文 + `application-label-en:'Stretch Timer'`。
- 执行链：builder（codebuddy/deepseek-v4.1-flash）→ code-reviewer（codebuddy/glm-5.3-flash，P0=0 P1=0，3 条 P2 已闭环）→ qa 静态（codex/gpt-6-luna，含「删 en key 触发 tsc 报错」反证）→ 真机 QA（本窗口 bash 直驱，按 override 表 qa 行分支豁免）→ builder 修 P1 → supervisor（opencode-go/muse-spark-1.3-contributor）复检 PASS，rework=0。
- 评审/验收文档：`docs/review/CODE_REVIEW_T13.md`、`docs/qa/T13 多语言验收报告.md`（本轮结束时两份均为未纳入 git 版本管理的新增文件，提交时记得 `git add`）。
- 账本：`docs/model/TASK-MODEL-LOG.jsonl` 6 行、`DISPATCH-LOG.jsonl` 7 行，`node scripts/model/check-ledger.mjs` = LEDGER-OK。

## 一、当前工作进展

产品为“拉伸换边计时器”，用于拉伸或筋膜枪放松时进行左右换边计时。

已完成并验证：

1. 循环换边倒计时：单边倒计时、换边提醒、自动续段、完成提醒、暂停/继续/提前结束。
2. 陪伴动物：小狗、小兔、小猫，支持待机、专注、换边、完成状态。
3. 音效系统：换边音效、倒计时背景音、提醒持续时间设置。
4. 本地数据持久化：设置、历史记录、模式列表、当前模式均使用 AsyncStorage 保存。
5. 多主题系统：暖萌、科技、极简、杂志四套主题。
6. 模式/分组功能：
   - 首页模式切换；
   - 模式上下排列显示；
   - 设置页新建、编辑、复制、删除模式；
   - 保存当前设置为模式；
   - 模式包含总时长、单边时长、提醒音效、陪伴动物、背景音、主题、时间流速等配置。
7. 时间流速：支持 1～100 倍速，便于快速验证提醒和计时逻辑。
8. 锁屏计时精度：采用 endAt 绝对时间戳，并在 App 回到前台时重新结算。
9. Android APK 已构建并完成真机验证。
10. **当前最新 APK 是 1.6.0（versionCode 4，本地构建，含 F8 多语言），见本节第 0 条与第三节第 11 条**；下面 10~12 条是 V1.3 的历史归档记录（EAS 云端构建），**不是最新版**，仅留档：
    - EAS Build：8118bb45
    - 包名：com.stretch.sidetimer
    - APK 应用版本号：1.0.0
    - 产品文档版本：V1.3
    - 构建时间：2026-09-15
11. V1.3 当时已安装并启动验证：
    - 手机 2：型号 22101316C
    - 手机 3：型号 23054RA19C
12. V1.3 已归档到：
    `artifacts/拉伸换边计时器丨V1.3丨APK丨EAS-8118bb45.apk`
    - 文件大小约 79.8MB
    - SHA-256：
      `f78b3152bf9bf88e851814af3a93567bfdc199004d49953bd29b0baf13104486`

13. （2026-09-19）提醒音效重做，产品文档升至 V1.4：
    - 换边音由 5 种扩为 8 种，新增 警报 / 升调 / 闹钟；原有 5 种全部重新合成
    - 8 种音效统一 44.1kHz/16bit/单声道 wav，峰值 -0.3dBFS（旧版仅 -5~-6dBFS）、主频 1-3kHz（旧版 649-1567Hz）、时长 ≥0.9s（旧版最短 0.18s）
    - 生成脚本：`RNApp/scripts/generate-sounds.py`（可复现，改参数重跑即可；`--analyze` 可测量指标）
    - 旧素材归档：`artifacts/sounds-v1-backup/`（10 个 wav，可整包回退）
    - 修复 `RNApp/src/sounds/playSound.ts`：`seekTo` 异步但 `play()` 同步，原代码不等 seek 完成就 play，会导致二次起播落在音频末尾无声
    - 新增提醒优先（让路）：`App.tsx` 启动时调 `configureAudioMode()` 设 `interruptionMode: 'duckOthers'`，播提醒音时申请音频焦点、其他 App 音乐自动降音量，播完释放自动恢复；App 自身背景音在 remind 阶段本就自动停止
    - 改动文件：`spec.md`/`plan.md`/`data-model.md`/`tasks.md`（V1.3→V1.4）、`RNApp/App.tsx`、`RNApp/src/constants.ts`、`RNApp/src/sounds/playSound.ts`、`RNApp/assets/sounds/*.wav`

14. （2026-09-19）倒计时背景音新增"轻音乐"类，产品文档升至 V1.5：
    - 新增 4 首：禅意古筝（Senbazuru，日本筝）/ 静思钢琴（Reminiscing）/ 温暖苏醒（Reawakening，钢琴+大提琴）/ 轻柔随想（Facile，钢琴），放 `RNApp/assets/music/`，共 10MB
    - **来源 Incompetech（Kevin MacLeod），CC BY 4.0，署名是强制要求**。署名文案在 `constants.ts` 的 `MUSIC_ATTRIBUTION`，由设置页底部渲染。**勿删**。
    - 获取方式：Pixabay 被 Cloudflare 拦（curl 403、CDN 403、需登录态），改走 Incompetech 在 `llms.txt` 中**主动开放的机器可读接口** `pieces.json`（1442 首，含 feel/bpm/instruments 字段），程序化筛选后下载。筛选口径见 `artifacts/music-candidates/incompetech/清单.md`。
    - 处理脚本：`RNApp/scripts/prepare-music.py` —— 首尾交叉淡化 1.5s（无缝循环）+ ffmpeg `loudnorm` 响度归一（-18 LUFS / 真峰值 -1.5 dBTP）+ 转码 128kbps。处理中发现原始素材电平极不统一（有的峰值 -16dBFS、有的 +0.46dBFS 已削波），简易 RMS 归一不够（无损母带动态大，7 首被峰值顶住、差 5.5dB），改用 loudnorm 后差异压到 2.4dB。
    - UI：`BACKGROUND_SOUNDS` 每项加 `group` 字段，设置页主列表与模式编辑 Modal 均按"环境音 / 轻音乐"分块；试听时长按类型区分（环境音 2.5s、轻音乐 20s —— 白噪听音色够了，轻音乐 2.5s 判断不出曲子）
    - 改动文件：`spec.md`/`plan.md`/`data-model.md`/`tasks.md`（V1.4→V1.5）、`RNApp/src/constants.ts`、`RNApp/src/screens/SettingsScreen.tsx`、`RNApp/assets/music/*.mp3`（新增）、`RNApp/scripts/prepare-music.py`（新增）
    - 候选素材（含未选中的 6 首 + 5 首备选）留在 `artifacts/music-candidates/`，不进 APK

15. （2026-09-19）V1.5 APK 已本地构建并推送三台真机：
    - **构建方式：本地**（`eas build --platform android --profile preview --local`），非云端
    - 归档：`artifacts/拉伸换边计时器丨V1.5丨APK丨本地构建.apk`，88.2MB（92506954 字节）
    - SHA-256：`cf796bd354e4aa294ab70bffe01ccdebad542dbc0a0827bdad8d8c9e17f55b51`
    - 版本：versionName **1.5.0** / versionCode **2**（`eas.json` 的 `appVersionSource` 已由 remote 改为 **local**，版本号现在读 `app.json`）
    - 签名：沿用 EAS 云端的 keystore（`Using remote Android credentials`），**三台均为覆盖安装、用户数据完整保留**（实测最老三台的主题/动物/模式设置都在）
    - 体积对比：V1.3 为 79.8MB → V1.5 为 88.2MB（+8.4MB，主要是 4 首 96kbps 轻音乐 7.6MB + 新增音效）
    - 三台推送结果（均 `Success` + 启动成功）：

      | 设备 | serialno | 结果 |
      |---|---|---|
      | Redmi Note 11T Pro+ | `IN9LZTAYV4UGU4JF` | ✅ |
      | Redmi Note 12 Pro | `indq5xfi6hovay4d` | ✅ |
      | Redmi Note 12T Pro | `UKCESWB67PUO7LPB` | ✅ |
    - 本地构建环境（本机已具备）：JDK `openjdk@17`（brew，未链到 PATH，需显式 export）、Android SDK `/opt/homebrew/share/android-commandlinetools`（build-tools 35/36 + platforms 35/36 + ndk 27）、eas-cli 24.6.0
    - `RNApp/android/`（prebuild 生成）**保留**，后续本地构建可复用；`RNApp/build-*.apk` 临时产物已清理

16. （2026-09-19）V1.5.1 背景音 UI 补全，产品文档仍为 V1.6（仅 UI 文案/入口对齐，无新功能）：
    - 用户反馈两个 UI 缺口：①轻音乐分组原先没有独立「关闭」入口（只能借「倒计时声音」分组的关闭，不直观）；②三组都未标注「点击试听」。
    - 代码改动仅 `RNApp/src/screens/SettingsScreen.tsx`：
      - 「倒计时轻音乐」分组新增独立「关闭」入口（与「倒计时声音」分组并列）；
      - 三组标题统一：提醒音效（点击可试听）/ 倒计时声音（点击可试听，可关闭）/ 倒计时轻音乐（点击可试听，可关闭）；模式编辑 Modal 两组也同步；
      - 设置页底部提示文案重写：说明三组均点击即试听（音效约 2.5s、轻音乐约 20s）、结束音固定钟声、背景音计时中循环播放且换边提醒自动暂停、选「关闭」全程不播。
    - **设计要点（已与用户确认，未改代码）**：`backgroundSound` 是单字段（off / 环境音 / 轻音乐），故「关闭」为全局生效——点任一组「关闭」两组会同时高亮。属预期行为。
    - `tsc --noEmit` 通过；无新增/删除文件。
    - 版本：versionName **1.5.1** / versionCode **3**（app.json）。
    - 构建：本地 `eas build --platform android --profile preview --local`，归档 `artifacts/拉伸换边计时器丨V1.5.1丨APK丨本地构建.apk`。
    - 推送三台真机（2026-09-19，改用**无线调试 TCP/IP**，设备以 IP:端口标识，此前 USB serialno 已不可用）：

      | 设备 | adb 地址 | 结果 |
      |---|---|---|
      | Redmi Note 12T Pro | `192.168.31.104:5555` | ✅ |
      | Redmi Note 12 Pro | `192.168.31.31:5555` | ✅ |
      | Redmi Note 11T Pro+ | `192.168.31.8:5555` | ✅ |

      - 注：`192.168.31.31:39245` 与 `192.168.31.31:5555` 同 IP 同型号，判为同一台手机的重复 adb 会话，已去重只装一次。
      - 三台 `dumpsys` 校验均为 versionName 1.5.1 / versionCode 3。
    - **待用户决策（未改代码，V1.5.1 后）**：
      - ①「关闭」同时高亮两分组是否接受？若嫌别扭需把 `backgroundSound` 拆成「环境音开关 + 轻音乐开关」两字段（改动较大）。
      - ②轻音乐在换边那 1~3 秒会暂停让路给换边音（10 分钟计时断约 10 次）。可选改为「压低不停（duck）」但换边音会没那么突出。

## 二、下一步任务

当前没有 P0/P1 待办（F8 多语言已闭环），后续恢复开发时按以下顺序处理：

0. 若要加第三语言（预留能力已就绪）：新建 `RNApp/src/i18n/strings.<code>.ts` 写完整 `Record<StringKey, string>` → `src/i18n/index.tsx` 的 `LANGUAGES` 加一行 `{ code, label, strings }` → 页面代码零改动。**若还想让桌面图标名跟随新语言**：`plugins/withAndroidAppLocales.js`（已存在，当前只生成 `values-en`）里加对应 locale 分支，**不要去手写 `android/app/src/main/res/values-<code>/strings.xml` 作真源**（`eas build --local` 重跑 prebuild 会冲掉）。
   遗留可选项：历史记录页英文 `1 sides` 单复数未处理（英文观感 P2，未修）。

1. 先读取根目录 `AGENTS.md`、本 HANDOFF、`经验一句话.md`，确认当前开发状态。
2. 不重复开发已经完成的模式、主题、时间流速功能。
3. **待用户验收（2026-09-19 遗留）**：
   - 8 种提醒音效的"听感"需在红米真机上由用户确认是否够响、够明显。客观指标已达标（见第一节第 13 条），但响度主观感受只能人耳判定。若不满意，改 `RNApp/scripts/generate-sounds.py` 里对应函数的频率/时长/节奏参数后重跑脚本即可，无需动 App 代码。
   - 4 首轻音乐的**循环无缝度**与整体音感需用户确认。若嫌响度偏轻/偏响，改 `scripts/prepare-music.py` 的 `--target-lufs`（默认 -18）重跑，无需动 App 代码。
   - 未验证项：**真实音乐 App 被压低**的效果（duckOthers 的焦点类型与释放已实测正确，但"对方确实降音量"需设备上同时播放音乐才能观察）。
4. 版本号已统一：产品规格 V1.7，App 发布版本 1.6.0（versionCode 4，读 app.json，`eas.json` 的 `appVersionSource` 为 local）。后续发版时保持两者同步、递增 versionCode。
5. 如需重新构建 APK：先确认代码和文档变更；构建后将 APK 归档到 `artifacts/`；记录 EAS Build ID、版本号、构建日期、SHA-256；再进行真机安装和启动验证。
6. 可选后续功能：振动提醒、自定义总时长、通知栏常驻提醒、自动深浅色模式、云同步、账号、统计图表。
7. 当前明确不纳入范围的功能，除非用户重新提出，不要主动实现。

### 0.1 入库与残留清理（2026-09-27 收口，用户指令 commit + push main）

- 已删：`RNApp/default.profraw`（3.5MB 旧 Rust 剖析文件，本就被 `RNApp/.gitignore` 忽略，纯磁盘残留）。
- 已清：本轮 `/tmp` 下的任务书、构建日志、真机截图临时物。
- 已清：`RNApp/build-*.apk` 临时构建产物（与 `artifacts/` 归档 SHA-256 相同，删前已核对）。
- `.gitignore` 新增两条：`*.旧版-*`（迁移自旧模板的封存件，原件留工作区备查、不入库，避免与新版模板并存造成混淆）、`/temp/`（临时交付目录）。
- **`USER_MODEL_OVERRIDE.md` 是软链**（指母版真源，符合"分工表软链制、禁拷实文件"）。入库后在其他机器上必然断链——换机器时按规范拷母版真源覆盖该文件即可，不要改成实文件提交。
- 交付 APK 按既有规则 `*.apk` 不入库，留在 `artifacts/`（4 个 APK 共约 340MB + music-candidates 已跟踪）。

## 三、注意事项及相关规矩

1. 使用中文沟通。
2. （2026-09-27 起）本项目改走标准多智能体链：按根 `AGENTS.md` Phase2 主链 Builder→Code Reviewer→QA→Supervisor→TM 派工，不再直干。原「用户直干模式」条款作废。
3. 修改代码后必须测试，验证通过后再报告。
4. 修改需求时先更新 `spec.md`，再同步 `plan.md`、`data-model.md`、`tasks.md`，并升版本号。
5. 所有主题颜色和样式必须通过主题系统处理，禁止在组件内重新写死颜色。
6. 新增模式优先使用 App 内“设置 → 模式管理”，不要直接修改用户真实数据。
7. 演示数据必须可清除，不能污染真实历史记录。
8. APK 构建产物必须保留在 `artifacts/`，不要只保留云端链接。
9. 不提交 API Key、Token、`.env` 或真实隐私数据。
10. 未经明确指令不执行 git commit 或 git push。
11. 最新 APK 为 **1.6.0**（versionCode 4，本地构建，含 F8 多语言）。判断最新版以 `app.json` 的 version + `artifacts/` 归档文件 + 真机 `dumpsys` 校验为准，不要凭记忆的旧版本号。
12. 目标 Android 真机为红米；若 ADB 安装失败，优先检查设备授权、USB 调试和 MIUI USB 安装权限。
13. 重新安装同包名 APK 通常会保留本地设置、历史记录和模式数据，但重大版本升级前仍应提醒用户备份。
14. （2026-09-19）音效相关：
    - 换边音素材一律由 `RNApp/scripts/generate-sounds.py` 生成，**不要手工塞入来源不明的音频**——手工素材的峰值与主频不可控，正是本次"不够响"的根因。
    - 改音效后必须跑 `python3 scripts/generate-sounds.py --analyze` 复核指标（峰值应 ≈ -0.3dBFS、主频落在 1-3kHz、时长 ≥0.9s），再真机试听。
    - 真机验证响度不能靠 `adb shell dumpsys audio`：播放完的 AudioTrack 会长期停在 `state:started`，既验证不了"正在出声"，也验证不了静音。此项只能人耳判定。
    - App 已通过 `configureAudioMode()` 设置 `interruptionMode: 'duckOthers'`。真机实测焦点栈确认为 `gain: GAIN_TRANSIENT_MAY_DUCK`，且 `requestAudioFocus`/`abandonAudioFocus` 严格成对（间隔约 1.8-2s，等于音效时长），说明播完会释放焦点、音乐能恢复。**未实测"真实音乐 App 被压低"的效果**（需设备上同时播放音乐才能观察），此项留待人耳确认。
    - 已知不变项：若用户同时开启 App 自身倒计时背景音（循环播放），背景音会持续持有音频焦点，可能使其他 App 音乐在非提醒时段也处于降音量状态。此组合本身矛盾（背景音与环境音乐互斥），暂不特殊处理。
15. （2026-09-19）真机调试用 Expo Go（`host.exp.exponent`）复用旧设备：`adb reverse tcp:8081 tcp:8081` + `adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent`。注意点击坐标前必须先截图确认当前布局——设置页滚动后同一坐标会落到不同控件上，曾因此误判过一次。
16. （2026-09-19）轻音乐素材的增删改流程：
    - 下载 → `python3 scripts/prepare-music.py <源目录> <输出目录>` 处理（交叉淡化+响度归一）→ 放进 `RNApp/assets/music/` → 更新 `constants.ts` 的 `BACKGROUND_SOUNDS`（记得带 `group` 字段）
    - **必须同步更新 `MUSIC_ATTRIBUTION` 的曲名列表**：CC BY 4.0 要求署名，只写一部分曲目等于署名不完整。
    - 本机 `ffmpeg` 在 `/opt/homebrew/bin/ffmpeg`，处理脚本依赖它。
    - 素材站首选只接受"站方主动开放的接口"（如 Incompetech 的 `llms.txt` + `pieces.json`）。**不要用自动化手段绕过 Cloudflare 之类的访问保护**——即使动机正当，也是规避技术措施。


## 迁移整理记一笔（2026-09-23）
- 铺模板包：放71/备份7/跳过15；USER_MODEL_OVERRIDE.md 改软链指母版；旧 AGENTS 专属规矩已附新版末尾。
- CHANGE_REQUEST: NONE。账本两表示例行已删。基线：RNApp tsc PASS，lint/test 无脚本。UI 目检未做（无 web dev 条件）。

## 治理审计待办（2026-09-26，ORCA 治理层）—— ✅ 已闭环 2026-09-27
- 原「两本账为 0 字节：补建账本，或按'未开工/空占位'标注」—— **已闭环**：T13 开工时已补建并按 schema 记账，现 `docs/model/TASK-MODEL-LOG.jsonl` 6 行、`DISPATCH-LOG.jsonl` 7 行，`node scripts/model/check-ledger.mjs` = LEDGER-OK（model 用 provider/model 精确写法，角色交付 PASS≠整链验收，未闭环项以各文档残留风险记 chain_status=OPEN）。
- 依据与全量清单见 `1.Active/ORCA派工账本-逐项目待办清单.md`。

## neat-freak 知识收口（2026-09-27，T13 收尾派）
只改文档与规则、**零业务代码改动**（代码侧 `tsc` 状态与第 0 条验收时一致）。改动清单：

| 文件 | 改什么 | 为什么 |
|---|---|---|
| `spec.md` | V1.7 变更记录与 F8 的系统级文案条目：`values-en/strings.xml` 的真源改为 config plugin `plugins/withAndroidAppLocales.js`；「预留日、韩位置」改为「结构已对开，加文件+加表行即可」 | 原文口径停留在被真机 P1 证伪的"手写 res"阶段，且"预留位置"易读成已有占位 |
| `plan.md` | ① 目录结构整体重写：根路径 `app-glm/RNApp/`→`RNApp/`，删不存在的 `CountdownRing.tsx` / `TimerMachine.tsx`，补 `i18n/`、`plugins/`、`app.json`；② V1.7 变更记录补 config plugin 口径；③ **新增「F8 界面多语言实现方案」整节**（技术路线纠偏、文案层、状态持久化、config plugin 与 aapt 判据） | 原目录结构是早期残留、与真实文件树不符；F7 有实现方案节而 F8 只有变更记录一句，方案无处可查 |
| `data-model.md` | `language` 行末句残缺（「不进入模式快照 settings 之外的任何逻辑」）补全为「不进模式快照 + 切模式时显式带回当前语言」 | 原句语义不通；补全后与 `settingsToModeSettings` / `modeSettingsToSettings` 实现逐条对应 |
| `tasks.md` | ① **修 T13 掉出表格**（原第 23 行多一个空行，导致 T13 渲染在表外）；② T13 内容改为 config plugin 口径并补「模式编辑弹窗」；③ 新增 2026-09-27 状态行（含链路、rework=0、两条遗留） | 表格断裂属渲染缺陷；状态行缺失使 tasks.md 落后于实际进度 |
| `docs/handoff/HANDOFF.md` | ① DEV_BASELINE 由「五份 V1.7」改为「四份带版本 V1.7 + constitution 无版本号」；② 第 10~12 条 V1.3「最新 APK」改标为历史归档并指向真正的 1.6.0；③ 工作区外的截图证据引用改成文字描述（不保留任何临时目录路径）；④ 评审/验收文档的 git 状态注记改成耐久措辞；⑤ 第二节 0 的「再加 plugin」改为「plugin 已存在、只生成 en」；⑥ 治理审计待办标记已闭环 | 消除自相矛盾（份数）、过期版本号误导、指向工作区外的证据路径、已闭环待办仍挂着 |
| `RNApp/AGENTS.md` | 补一节「本项目自定义 config plugin」：点名 `plugins/withAndroidAppLocales.js`、声明 `res/values-*` 手改非真源、指向 `app.json` plugins 注册 | 该文件是 RNApp 目录内 agent 的唯一入口规则；本轮 P1 正是"手改 res 被 prebuild 冲掉"，此坑必须落在入口处 |

临时构建产物清理：`RNApp/build-1790453239191.apk`（92516870 字节）已删。删前核对与 `artifacts/拉伸换边计时器丨V1.6丨多语言丨APK丨本地构建.apk` **SHA-256 完全相同**（`05770ddb…3938`），是同一份文件的重复副本，删除零信息损失；`artifacts/` 下 4 个交付 APK 全部保留未动。根 `.gitignore` 已含 `*.apk`，本次删除不影响任何已入库内容。

未改（留给人工拍板，见收口清单）：
- 历史记录页英文 `1 sides` 单复数（功能无碍、英文观感 P2，修它要动 `strings.en.ts` 的 `history.rowDesc` 或引入复数分支——属开发内小改，CHANGE_REQUEST: A）
- 第二台真机 `indq5xfi6hovay4d` 屏幕全黑无法出图，目视验收待设备恢复后补做
- `RNApp/default.profraw`（3.5MB，2026-09-14 遗留 Rust 性能剖析文件，非本轮 build 产物，已被 `RNApp/.gitignore` 忽略）
- `AGENTS.md` 尾部整段重复的「本项目原有规则（迁移自旧 AGENTS.md）」旧版全文，与上半部新版大面积重复；属中央模板同步范围，非本项目 neat-freak 该动，已提请编排者注意
