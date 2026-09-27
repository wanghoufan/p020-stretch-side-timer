# 任务清单（tasks.md）

> 版本：V1.8 ｜ 依据：spec.md V1.8 + plan.md V1.8。每项可独立执行与验收。
> 状态（2026-09-15）：T1~T11 全部完成并通过 Android 真机验收（对应 spec DoD）；T12 模式/分组功能已完成并通过真机验收，APK 已推送至手机。
> 状态（2026-09-19）：T6 音效重做（spec F3 扩为 8 种 + 整体提响度）代码完成并通过 TypeScript 编译与真机加载验证；换边提醒在真机的听感验收待用户确认。
> 状态（2026-09-19）：背景音新增轻音乐类（4 首，CC BY 4.0）——素材处理、分组 UI、署名文案、试听时长区分均完成，已通过 TypeScript 编译与真机验证（分组渲染正确、选中切换正确、mp3 可加载播放）；循环无缝度与听感待用户确认。
> 状态（2026-09-19）：背景音 UI 补全 —— 轻音乐分组新增独立「关闭」入口、两组标题均标注"点击可试听"、底部提示改写说明试听时长与循环行为；已通过 tsc，待重新打包推送。
> 状态（2026-09-27）：T13 界面多语言（中文/英文）完成并通过真机验收（App V1.6.0 / versionCode 4，APK 已推送本次在线的两台红米：IN9LZTAYV4UGU4JF 目视全验收、indq5xfi6hovay4d 屏幕全黑仅安装+dumpsys 校验）。链路：builder → code-reviewer（P0=0 P1=0）→ 静态 QA（含漏翻反证）→ 真机 QA → builder 修 P1（values-en 未进包，改 config plugin）→ supervisor 复检 PASS，rework=0。**遗留 P2**：历史记录页英文 `1 sides` 单复数未处理（英文观感问题，不影响功能）。第二台真机（indq5xfi6hovay4d）因屏幕故障全黑无法出图，**该台目视验收待屏幕恢复后补做**。

| Task | 内容 | 验收标准 |
|---|---|---|
| T1 | 初始化 Expo 项目（RNApp，TypeScript 模板） | `npx expo start` 可启动，模拟器/Expo Go 显示默认页 |
| T2 | 安装依赖并搭 3-Tab 导航骨架 | React Navigation Bottom Tabs 有 Timer/Settings/History 三页，可切换，每页标题不同 |
| T3 | 常量与设置上下文：总时长/单边/音效/提醒时长/动物选项 + AsyncStorage 持久化 | 修改设置立即生效；杀掉重开设置仍在（spec F4 DoD） |
| T4 | 计时状态机（useTimer）：idle/running/paused/remind/finished + 循环换边 | 10min+1min：跑满 10 段，每段到 0 进入 remind 后自动续段；暂停/继续正确（spec F1 DoD） |
| T5 | 计时页 UI：大倒计时 + 第几边/总段数 + 开始/暂停/继续/结束 | 显示 1/10→10/10；按钮状态随状态机切换；结束回待机 |
| T6 | 音效：8 种换边音（叮咚/叮叮叮/蜂鸣/钟声/单声叮/警报/升调/闹钟，由 scripts/generate-sounds.py 合成）+ expo-audio 播放 + 提醒时长 1/2/3 秒 | 换边音、结束音可区分；按设定时长响；8 种音效峰值 ≥ -0.5dBFS、主频 1-3kHz、时长 ≥0.9 秒（spec F3 DoD） |
| T7 | 小动物组件：🐶🐰🐱 3 种 + 4 状态联动 + 动画 | 状态变化时动物表现/文案不同，动画流畅（spec F2 DoD） |
| T8 | 设置页 UI：总时长/单边/动物/音效/提醒时长选择 | 选择项与 spec 常量一致，修改即持久化 |
| T9 | 历史记录：会话结束写入 + 列表 + 单删/清空 | 每次会话自动写一条；删除/清空立即生效且持久化（spec F5 DoD） |
| T10 | 全局验收 | 对照 spec DoD 表逐条在真机/模拟器验收；3 页可切换、无崩溃、移动端布局 |
| T11 | 多主题风格：src/theme/ 色板 token + useTheme hook + Settings.theme 字段 + 设置页主题分组 + 全页面动态取色 | 4 套主题（暖萌/科技/极简/杂志）切换后计时/设置/记录/底部导航/状态栏全部跟随变色；选择持久化重启不丢；切换不改变计时行为（spec F6 DoD） |
| T12 | 模式/分组功能：Mode 数据模型 + SettingsContext CRUD + 首页垂直模式列表 + 设置页模式管理（新建/编辑/复制/删除/保存当前为模式）+ 时间流速 1-100 倍 | 首页模式列表垂直排列，每条显示完整信息（总X 单Y 提Z）；设置页可 CRUD 模式；保存当前为模式自动生成名称【总X 单Y 提Z—】；时间流速 1-100 倍可调，100 倍速可在 3 秒内走完 100 秒显示时间；模式数据持久化（spec F7 DoD） |
| T13 | 界面多语言（中文/英文）：`src/i18n/`（strings.zh.ts / strings.en.ts / index.tsx + LANGUAGES 表 + useT）+ `SettingsContext.language` 字段 + `App.tsx` 顶层 `I18nProvider` + 设置页「界面语言」分组 + 全部界面文字替换为 `t(key)` + config plugin `plugins/withAndroidAppLocales.js` 生成 `values-en/strings.xml`（桌面图标名 app_name） | 设置页可切中文/English；**不重启 App** 切到英文后计时页/设置页/历史页/底部导航/模式编辑弹窗/提示语全部英文；杀 App 重开仍为英文；切回中文立即恢复；设置/模式/历史数据不丢；计时不中断；新增第三语言只需加一个 strings 文件 + LANGUAGES 加一行（spec F8 DoD） |

| T14 | 界面语言增「跟随系统」：装 `expo-localization` + `LANGUAGES` 首位加伪项 `{ code:'system', label:'跟随系统' }` + 运行时解析系统语言（命中 zh/en 则跟随，否则回落 zh）+ `Settings.language` 默认值改 'system' | 设置页语言三项且「跟随系统」排第一；中文系统真机选「跟随系统」→ 界面中文（证明确实跟随系统而非固定值）；手动切中文/英文后重开仍保持手动选择；「跟随系统」时手动选择优先；加新语言仍是一个文件 + 表加一行（spec F8 DoD） |

> 状态（2026-09-27）：T14 界面语言「跟随系统」完成并通过真机验收（App V1.7.0 / versionCode 5，APK 已推送两台红米）。链路：builder → code-reviewer（P0=0 P1=0）→ builder 修 P2-1（改用 useLocales 实时跟随）→ 静态 QA（resolveLanguage 12 用例实跑）→ 真机 QA → supervisor 复检 PASS，rework=0。**遗留 P2**：项目既有 expo/slider 版本偏差（非本次引入）。第二台真机屏幕仍全黑，仅安装+dumpsys 校验。

## 执行顺序

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11（T5/T6/T7 在 T4 完成后可并行推进；T11 在 T8 完成后可推进，依赖 SettingsContext）→ T13（依赖 T3/T8，依赖 T11 的 settings 持久化结构）→ T14（依赖 T13）。
