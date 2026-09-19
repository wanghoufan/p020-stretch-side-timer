# HANDOFF｜交接

- Captured at：2026-09-19
- PROJECT_PHASE：DEVELOP 暂停
- DEV_BASELINE：SDD 五份文档 V1.6
- Stage ID：TASK-2-MVP
- 当前状态：开发暂时结束，可随时恢复。2026-09-19 完成音效重做 + 轻音乐背景音 + 背景音 UI 补全，已本地构建并推送三台真机（最新 V1.5.1）

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
10. 最新 APK：
    - EAS Build：8118bb45
    - 包名：com.stretch.sidetimer
    - APK 应用版本号：1.0.0
    - 产品文档版本：V1.3
    - 构建时间：2026-09-15
11. 最新 APK 已安装并启动验证：
    - 手机 2：型号 22101316C
    - 手机 3：型号 23054RA19C
12. 最新 APK 已归档到：
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

当前没有 P0/P1 待办，后续恢复开发时按以下顺序处理：

1. 先读取根目录 `AGENTS.md`、本 HANDOFF、`经验一句话.md`，确认当前开发状态。
2. 不重复开发已经完成的模式、主题、时间流速功能。
3. **待用户验收（2026-09-19 遗留）**：
   - 8 种提醒音效的"听感"需在红米真机上由用户确认是否够响、够明显。客观指标已达标（见第一节第 13 条），但响度主观感受只能人耳判定。若不满意，改 `RNApp/scripts/generate-sounds.py` 里对应函数的频率/时长/节奏参数后重跑脚本即可，无需动 App 代码。
   - 4 首轻音乐的**循环无缝度**与整体音感需用户确认。若嫌响度偏轻/偏响，改 `scripts/prepare-music.py` 的 `--target-lufs`（默认 -18）重跑，无需动 App 代码。
   - 未验证项：**真实音乐 App 被压低**的效果（duckOthers 的焦点类型与释放已实测正确，但"对方确实降音量"需设备上同时播放音乐才能观察）。
4. 版本号已统一：产品规格 V1.6，App 发布版本 1.5.1（versionCode 3，读 app.json，`eas.json` 的 `appVersionSource` 为 local）。后续发版时保持两者同步、递增 versionCode。
5. 如需重新构建 APK：先确认代码和文档变更；构建后将 APK 归档到 `artifacts/`；记录 EAS Build ID、版本号、构建日期、SHA-256；再进行真机安装和启动验证。
6. 可选后续功能：振动提醒、自定义总时长、通知栏常驻提醒、自动深浅色模式、云同步、账号、统计图表。
7. 当前明确不纳入范围的功能，除非用户重新提出，不要主动实现。

## 三、注意事项及相关规矩

1. 使用中文沟通。
2. 本项目此前采用用户直干模式：不派 subagent，不启动多智能体开发链。
3. 修改代码后必须测试，验证通过后再报告。
4. 修改需求时先更新 `spec.md`，再同步 `plan.md`、`data-model.md`、`tasks.md`，并升版本号。
5. 所有主题颜色和样式必须通过主题系统处理，禁止在组件内重新写死颜色。
6. 新增模式优先使用 App 内“设置 → 模式管理”，不要直接修改用户真实数据。
7. 演示数据必须可清除，不能污染真实历史记录。
8. APK 构建产物必须保留在 `artifacts/`，不要只保留云端链接。
9. 不提交 API Key、Token、`.env` 或真实隐私数据。
10. 未经明确指令不执行 git commit 或 git push。
11. 最新 APK 为 **1.5.1**（versionCode 3，本地构建）。判断最新版以 `app.json` 的 version + `artifacts/` 归档文件 + 真机 `dumpsys` 校验为准，不要凭记忆的旧版本号。
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
