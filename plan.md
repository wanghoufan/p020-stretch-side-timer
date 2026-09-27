# 技术计划（plan.md）

> 版本：V1.7 ｜ 依据：spec.md V1.7（不与其冲突）；遵守 constitution.md。
> 变更记录：V1.7（2026-09-27）新增 F8 界面多语言（中文/英文）实现方案：`src/i18n/`（`strings.zh.ts` / `strings.en.ts` / `index.tsx` 提供 `I18nProvider` + `useT()`）；`LANGUAGES` 常量表（code/label），新增语言 = 加一个文件 + 表加一行；`SettingsContext` 增 `language` 字段（存 `@stretch/settings`，缺省 'zh'）；`App.tsx` 在最外层包 `I18nProvider`，语言值取自 SettingsContext，切换即整树重渲染、**不重启不闪屏**；设置页新增「界面语言」分组；Android 桌面图标名（`app_name`）的系统级文案由 **Expo config plugin `plugins/withAndroidAppLocales.js`**（`withDangerousMod` 在 prebuild 之后写 `res/values-en/strings.xml`）生成并在 `app.json` 的 plugins 注册——**不能手写 `android/app/src/main/res/values-en/strings.xml` 作真源**，`eas build --local` 会在临时目录重跑 prebuild 冲掉手改文件（T13 真机 P1 根因）。V1.6（2026-09-19）背景音 UI 补全（SettingsScreen）：轻音乐分组新增独立「关闭」Chip（与「倒计时声音」分组的「关闭」绑定同一 `backgroundSound === 'off'` 状态，二者同时高亮，属预期——关闭是全局的）；环境音与轻音乐两组 Group 标题补齐"点击可试听"；设置页底部提示改写为说明三组均可试听、试听时长差异、循环与换边暂停行为、以及「关闭」语义。模式编辑 Modal 同步。V1.5（2026-09-19）背景音新增"轻音乐"类：assets/music/ 放 4 首 mp3（源自 Incompetech，CC BY 4.0），BACKGROUND_SOUNDS 每项加 `group` 字段（环境音/轻音乐），SettingsScreen 主列表与模式编辑 Modal 均按 group 分块渲染，新增 MUSIC_ATTRIBUTION 署名常量并在设置页底部展示；新增 scripts/prepare-music.py（首尾交叉淡化做无缝循环 + ffmpeg loudnorm 响度归一 + 转码）；试听时长按 group 区分（环境音 2.5s / 轻音乐 20s）。V1.4（2026-09-19）音效方案重做：换边音由 5 种扩为 8 种（新增 警报/升调/闹钟），全部改由 `RNApp/scripts/generate-sounds.py` 合成（峰值 -0.3dBFS、主频 1-3kHz、多脉冲长时长）；新增音频会话配置 `configureAudioMode()`（`duckOthers`，提醒时压低其他 App 音频、播完恢复，同时保证静音模式下提醒仍响且走扬声器）；sounds/playSound.ts 修复 seekTo 异步与 play 同步导致的二次起播无声；assets/sounds/ 旧素材归档至 artifacts/sounds-v1-backup/。V1.3（2026-09-15）新增 F7 模式/分组：src/constants.ts（Mode 接口）、SettingsContext（modes 状态 + CRUD）、TimerScreen（垂直模式列表）、SettingsScreen（模式管理 + 保存当前为模式 + 时间流速滑块）、useTimer（按流速调整计时）。V1.2（2026-09-15）新增主题系统：src/theme/（themes.ts 色板 token + useTheme hook），SettingsContext 增 theme 字段，全部页面 color 走主题 token 禁写死。V1.1（2026-09-14 neat-freak 对齐）计时实现改为"endAt 绝对时间戳校正 + AppState 回前台结算"（P2 已实现）；音效资源由 5 个扩为 8 个（5 换边音 + 3 背景音）；新增倒计时背景音播放方案。V1.0 为开发基线。

## 技术选型

| 领域 | 选型 | 理由 |
|---|---|---|
| 框架 | Expo SDK 57 + TypeScript | 作业要求；一键跑 iOS 模拟器/Expo Go |
| 导航 | React Navigation（Bottom Tabs，3 页） | 成熟稳定、文档全；本 App 无需文件式路由的复杂度 |
| 状态管理 | React Context + useReducer | 全局只有设置 + 计时状态，Context 够用，不引 Redux/Zustand |
| 本地存储 | @react-native-async-storage/async-storage | 设置 + 历史记录均为小 JSON，AsyncStorage 足够；不引入 SQLite 的复杂度 |
| 计时实现 | useTimer 状态机（idle/running/paused/remind/finished）+ **endAt 绝对时间戳校正**（running 期 250ms 轮询按 Date.now() 结算剩余；AppState 回前台立即结算，锁屏/后台不丢时间） | 纯 JS 可靠；覆盖所有边界；P2 已修锁屏精度 |
| 音效 | expo-audio 播放内置音频资源 | SDK 57 官方推荐（expo-av 已废弃）；13 个短音效（8 换边音 + 5 背景音）放 assets/sounds，换边音由脚本合成以保证响度与频段可控 |
| 动画 | React Native Animated API（或 reanimated） | 弹跳/呼吸/缩放简单动画，Animated 够用且零额外配置 |
| 主题 | 自定义 Theme token（src/theme/themes.ts）+ useTheme hook | 4 套配色（暖萌/科技/极简/杂志）；颜色/圆角/字重/发光等 token 化，组件样式工厂 makeStyles(theme) + useMemo 动态生成，切换即全局生效 |
| 安全区 | react-native-safe-area-context（Expo 自带） | 遵守 constitution 安全区原则 |
| 小动物 | emoji 大字渲染（🐶🐰🐱）+ 状态文案/动画 | 零素材依赖、清晰可爱；后续要换插画只需换渲染层 |

## 页面路由

```
Bottom Tabs
├── Timer    （计时页，默认首页）
├── Settings （设置页）
└── History  （历史记录页）
```

## 整体实现方案

### 目录结构
```
RNApp/
├── App.tsx                # 入口：SettingsProvider + I18nProvider + HistoryProvider + NavigationContainer + Tabs
├── plugins/
│   └── withAndroidAppLocales.js  # Expo config plugin：prebuild 后生成 res/values-en/strings.xml（app_name）
├── app.json               # plugins 数组含 "./plugins/withAndroidAppLocales"（F8）
├── src/
│   ├── navigation/        # BottomTabs 定义
│   ├── screens/
│   │   ├── TimerScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── components/
│   │   ├── Pet.tsx        # 小动物：emoji + 4 状态 + 动画
│   │   └── PromptBanner.tsx   # 换边/完成 大字提示
│   ├── timer/
│   │   └── useTimer.ts    # 计时状态机 + 循环换边逻辑（endAt 校正）
│   ├── store/
│   │   ├── SettingsContext.tsx # 设置 + 模式 + 语言 + 持久化
│   │   └── HistoryContext.tsx  # 历史记录 + 持久化
│   ├── sounds/            # 音效选择 + 播放封装（expo-audio）
│   ├── theme/             # 主题系统：themes.ts（4 套色板 token）+ useTheme.ts（取色 hook）
│   ├── i18n/              # 界面多语言：strings.zh.ts（key 真源）/ strings.en.ts / index.tsx（Provider + 语言表 + useT）
│   └── constants.ts       # 总时长/单边/音效/提醒时长 选项常量（与 spec 一致）
```

### 计时状态机（核心）
- 状态：`idle`（待机）→ `running`（倒计时中）→ 到 0 → `remind`（响换边音+大字"换边"，持续 1~3 秒）→ 自动回 `running` 下一段 → …… → 最后一段结束 → `finished`（结束音+"完成"）
- `paused` 可从 `running` 进入，从 `paused` 继续回 `running`
- 段数 = 总时长 ÷ 单边时长（spec F1，整除）；当前边从 1 递增
- 提前结束：任意状态可点"结束"→ 回 `idle`，并把已完成边数写历史（若 >0）

### 音效方案
- 换边音 8 种（叮咚/叮叮叮/蜂鸣/钟声/单声叮/警报/升调/闹钟）定义在 constants.ts 的 `SOUNDS`；背景音 9 种定义在 `BACKGROUND_SOUNDS`，每项带 `group` 字段分"环境音"（时钟滴答/清脆滴答/短促脉冲/雨声白噪/海浪白噪）与"轻音乐"（禅意古筝/静思钢琴/温暖苏醒/轻柔随想）两类
- 全部换边音由 `RNApp/scripts/generate-sounds.py` 合成：44.1kHz/16bit/单声道 wav，峰值统一 -0.3dBFS、主频落在 1-3kHz、多脉冲节奏且时长 ≥0.9 秒（面向筋膜枪等嘈杂环境）；要调音只改脚本参数后重跑，素材可复现
- 轻音乐 4 首放 `RNApp/assets/music/`，由 `RNApp/scripts/prepare-music.py` 处理：首尾交叉淡化 1.5s（无缝循环）+ ffmpeg `loudnorm` 响度统一到 -18 LUFS / 真峰值 -1.5 dBTP + 转码 128kbps 立体声。来源 Incompetech（Kevin MacLeod），**CC BY 4.0 要求署名**，文案见 `MUSIC_ATTRIBUTION`，由设置页底部渲染（勿删）
- 结束音固定取 SOUNDS 中的钟声（`DONE_SOUND_ID = 'bell'`），与换边音区分
- 提醒持续时长（1/2/3 秒）：进入 remind 时响一次，提醒期间每秒再响一次；时长到自动续段
- 背景音：running 时循环播放（音量压至 50%），进入 remind 自动停止、回 running 恢复（`stopBackground()` 用 `pause()` 而非 `seekTo(0)`，故恢复时从暂停位置继续、不从头重播）；设置页两组各自都有「关闭」入口，所有选项点击即试听（环境音 2.5s、轻音乐 20s）
- 提醒优先（App.tsx + playSound.ts `configureAudioMode()`）：启动时 `setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers', shouldRouteThroughEarpiece: false })`——播提醒音时申请音频焦点，其他 App 音乐自动降音量，播完释放焦点自动恢复；`playsInSilentMode` 保证静音模式下提醒仍响，`shouldRouteThroughEarpiece: false` 保证走扬声器（听筒音量小）
- 播放实现（sounds/playSound.ts）：`seekTo` 是异步、`play()` 是同步，必须等 seek 完成再 play，否则二次起播落在音频末尾 → 提醒无声

### 数据流
- SettingsContext：读 AsyncStorage「settings」初始化 → 修改即写回 → 全 App 消费
- HistoryContext：读「history」数组 → 会话结束时 unshift 一条 → 删除/清空即写回
- 会话结束（完成或提前结束且完成段数>0）才写历史

## 与 spec 的一致性

- 总时长 5/10/15/20、单边 30s/45s/1min/2min、换边音 8 种 + 背景音 9 种（环境音 5 + 轻音乐 4）、提醒时长 1/2/3s、动物 3 种——均为 spec 常量直引，不自行增删
- 3 页 Tab、历史字段（日期时间/总时长/完成段数/单边时长）与 spec F4/F5 一致
- 第一版不做：振动、深浅色、通知、自定义总时长（对应 spec Out of Scope）

## F7 模式/分组实现方案

### 数据模型（src/constants.ts）
- `Mode` 接口：id, name, settings（含 totalMinutes/perSideSeconds/soundId/alertDurationSec/pet/backgroundSound/theme/timeSpeed）, createdAt, updatedAt
- `DEFAULT_MODE_SETTINGS`：默认设置模板，含 timeSpeed: 1

### SettingsContext 扩展（src/store/SettingsContext.tsx）
- 状态：`modes: Mode[]`、`activeModeId: string | null`
- 操作：`createMode(name, partial)`、`updateMode(id, updates)`、`deleteMode(id)`、`duplicateMode(id)`、`setActiveMode(id)`
- 持久化：AsyncStorage 新增 `@stretch/modes`、`@stretch/activeMode`
- 激活模式切换时，settings 自动更新为该模式的 settings 快照

### 首页模式切换（src/screens/TimerScreen.tsx）
- 底部垂直列表，每条显示模式名称 + 完整信息（总X 单Y 提Z）
- 当前选中模式高亮（accent 背景）
- 非 idle/finished 状态禁用切换

### 设置页模式管理（src/screens/SettingsScreen.tsx）
- 模式管理区域：模式列表卡片 + 启用/编辑/复制/删除按钮
- "保存当前为模式"按钮：从当前 settings 自动生成名称【总X 单Y 提Z—】，用户可补充备注
- 底部弹出 Modal：编辑模式所有设置项（含时间流速滑块）

### 时间流速（src/timer/useTimer.ts）
- 计时器按 `流速 × 实际时间` 递减：`endAt = Date.now() + (perSideSeconds / timeSpeed) * 1000`
- 剩余秒数计算：`Math.ceil(realRemaining * timeSpeed)`
- 默认 1 倍速，100 倍速可在 3 秒内走完 100 秒显示时间

## F8 界面多语言实现方案

### 技术路线纠偏（重要）
- 用户最初设想的是原生做法（`values/strings.xml` + `values-en` + DataStore + Activity recreate），**本项目不适用**：Expo/React Native（RN 0.86 / Expo 57）的界面文字由 JS 渲染，**不经过 `res/values`**，原生 `values-en` 对 App 内界面无效。
- 故界面文案走 **RN 侧 i18n 层**（`src/i18n/`）；原生 `values-en/strings.xml` 只承担**系统级文案**（桌面图标名 `app_name`）跟随系统语言。

### 文案层（src/i18n/）
- `strings.zh.ts`：**key 的唯一真源**，导出 `zh` 与 `type StringKey`
- `strings.en.ts`：标注 `Record<StringKey, string>`，**漏翻一个 key 直接 tsc 报错**（QA 反证：删任一 en key → 编译失败）
- `index.tsx`：
  - `LANGUAGES` 常量表（`{ code, label, strings }`）→ `LanguageCode` 由表推导，加一行即扩展
  - `I18nProvider`：语言唯一真源是 `SettingsContext.settings.language`，切换 → Provider 重渲染 → 整棵界面树换表，**只重渲染、不 remount**
  - `useT()` / `useI18n()`：`t(key, params)`，文案里 `{名字}` 占位符由 params 替换
  - id → 文案 key 映射表（`PET_NAME_KEY` / `SOUND_LABEL_KEY` / `BACKGROUND_LABEL_KEY` / `THEME_LABEL_KEY` / `PER_SIDE_LABEL_KEY`），用 `Record<Id, StringKey>` 标注：新增音效/动物/主题/背景音却忘登记 key 会在 tsc 报错
- 占位符替换用 `split/join` 逐名替换（无第三方 i18n 库，Expo 57 亦不内置）
- `label` 用各语言自称（中文/English），属语言表自身常量，不进 strings 文案表
- 依赖方向：i18n → store（取 language）；store 侧引用 `LanguageCode` 只用 `import type`，编译期擦除，无运行期环

### 状态与持久化
- `Settings.language` 存 `@stretch/settings`（**不新增 AsyncStorage 键**），默认 `'zh'`；文案本体是编译期代码，不入存储
- 模式快照**不含** language（全局偏好）；`modeSettingsToSettings` 显式带当前语言回去，避免启用模式把语言打回默认
- 加载时 `{ ...DEFAULT_SETTINGS, ...parsed }`，存量数据缺 language 自动回落 `'zh'`，不报错

### 系统级文案（config plugin）
- `plugins/withAndroidAppLocales.js`：`withDangerousMod(config, ['android', ...])`，在 prebuild 之后写 `app/src/main/res/values-en/strings.xml`（`app_name = Stretch Timer`）
- `app.json` 的 `plugins` 数组注册 `"./plugins/withAndroidAppLocales"`
- **`android/app/src/main/res/values-en/strings.xml` 手改无效**：`eas build --local` 在临时目录重跑 prebuild 会冲掉；仓里那份只是不走 prebuild 直接 gradle 构建时的回退副本
- 验证判据用 `aapt2 dump resources`（看 `() 中文 / (en) 英文`）与 `aapt dump badging`（看 `application-label-en`）；`unzip -l | grep values-en` 对 string 资源天然无效，别当判据

## 风险与对策

| 风险 | 对策 |
|---|---|
| App 退后台/锁屏，setInterval 变慢 | 已实现 endAt 绝对时间戳校正 + AppState 回前台立即结算（P2）；后台通知栏常驻提醒仍不做（spec Out of Scope） |
| 音效资源缺失 | 8 个短音效随项目打包，缺失时降级用系统提示音并提示 |
| 模拟器无音频输出 | 用系统提示音兜底；真机 Expo Go 验证声音 |
| 异步存储竞态 | 写历史/设置串行 await，完成后再响应 UI |
