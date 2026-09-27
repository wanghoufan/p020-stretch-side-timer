# 数据模型（data-model.md）

> 版本：V1.7 ｜ 依据：spec.md V1.7 + plan.md（模式对应）；命名与两文档一致。
> 存储：全部本地，AsyncStorage 四个键（settings/history/modes/activeMode），无后端、无关系型数据库。
> 变更记录：V1.7（2026-09-27）settings 新增 `language` 字段（spec F8 界面多语言），取值 `'zh' | 'en'`，默认 `'zh'`；**不新增 AsyncStorage 键**（语言随 settings 一起持久化，存于 `@stretch/settings`）；文案本体为编译期代码（`src/i18n/strings.zh.ts` / `strings.en.ts`），不入存储。（spec F3 背景音 UI 补全：轻音乐分组新增「关闭」入口、两组标注点击试听；`backgroundSound` 取值未变，'off' 仍为唯一关闭态）。V1.5（2026-09-19）settings.backgroundSound 可选值由 5 种扩为 9 种（spec F3 背景音新增轻音乐类，增加 senbazuru/reminiscing/reawakening/facile）。V1.4（2026-09-19）settings.soundId 可选值由 5 种扩为 8 种（spec F3 音效重做，新增 alarm/rising/digital）；含修正 backgroundSound 取值与实现一致（off + 5 种背景音，原文档误记为 3 种）。V1.3（2026-09-15）新增 Mode 数据模型（spec F7 模式/分组），AsyncStorage 新增 @stretch/modes、@stretch/activeMode；settings 新增 timeSpeed 字段。V1.2（2026-09-15）settings 新增 theme 字段（spec F6 主题风格），取值 default/tech/minimal/magazine，默认 default。V1.1（2026-09-14 neat-freak 对齐）settings 新增 backgroundSound 字段（spec F3 倒计时背景音）。V1.0 为开发基线。

## 1. 设置（settings）

键：`@stretch/settings`，值为单个 JSON 对象。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| totalMinutes | number | 是 | 总时长（分钟），取值 5/10/15/20，对应 spec F1 |
| perSideSeconds | number | 是 | 单边时长（秒），取值 30/45/60/120，对应 spec F1 |
| soundId | string | 是 | 当前提醒音效 ID，来自 constants 音效库（8 种：dingdong/dingdingding/beep/bell/ding/alarm/rising/digital），对应 spec F3 |
| alertDurationSec | number | 是 | 提醒音持续时长（秒），取值 1/2/3，对应 spec F3 |
| pet | 'dog' \| 'rabbit' \| 'cat' | 是 | 陪伴动物，🐶/🐰/🐱，对应 spec F2 |
| backgroundSound | 'off' \| 环境音 5 种（ticktock/clock_tick1/clock_tick2/rain/waves）\| 轻音乐 4 首（senbazuru/reminiscing/reawakening/facile） | 是 | 倒计时背景音，off=关闭；其余 9 种计时中循环播放，对应 spec F3。轻音乐为 Incompetech CC BY 4.0 素材，需在设置页署名 |
| theme | 'default' \| 'tech' \| 'minimal' \| 'magazine' | 是 | 主题风格，default=暖萌（默认）；tech=科技、minimal=极简、magazine=杂志，对应 spec F6 |
| timeSpeed | number | 是 | 时间流速倍率，取值 1-100，默认 1；100 倍速可在 3 秒内走完 100 秒显示时间，用于快速验证提醒，对应 spec F7 |
| language | 'zh' \| 'en' | 否（默认 'zh'） | 界面语言，'zh'=中文（默认）、'en'=英文，对应 spec F8。存量数据无此字段时按 'zh' 处理，**不因缺字段报错**；切换立即生效并持久化。**不进入模式快照**（`settingsToModeSettings` 刻意不带该字段），因此新建/编辑/复制模式与切换/启用模式都不读写它；`modeSettingsToSettings` 显式把当前语言带回去，保证启用模式不会把界面语言打回默认值 |

约束：
- 段数 = totalMinutes × 60 ÷ perSideSeconds，必须为整数（选项设计保证整除）。
- 修改任意字段立即持久化，重启不丢失（spec F4 DoD）。

## 2. 历史记录（history）

键：`@stretch/history`，值为对象数组，按时间倒序（最新在前）。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | 是 | 唯一 ID（时间戳+随机），用于单条删除 |
| date | ISO 字符串 | 是 | 会话结束的日期时间，展示用 |
| totalMinutes | number | 是 | 本次设定总时长（分钟），快照，与当次设置一致 |
| perSideSeconds | number | 是 | 本次设定单边时长（秒），快照 |
| completedSides | number | 是 | 实际完成的边数（段数），≥1 才写记录 |

约束：
- 会话完成或提前结束且 completedSides ≥ 1 时，在会话结束时写入一条（spec F5）。
- 支持按 id 单条删除、清空全部，操作后立即持久化。
- 数组长度不做上限限制（本地数据量小）；第一版不提供统计聚合。

## 3. 模式（modes）

键：`@stretch/modes`，值为 Mode 对象数组，按创建时间倒序（最新在前）。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | string | 是 | 唯一 ID（`mode_时间戳_随机`），用于编辑/删除 |
| name | string | 是 | 模式名称，自动生成格式【总X 单Y 提Z—】+ 用户备注，如【总5 单30 提3—】快速训练 |
| settings | object | 是 | 模式设置快照，结构同 settings 对象（含 totalMinutes/perSideSeconds/soundId/alertDurationSec/pet/backgroundSound/theme/timeSpeed） |
| createdAt | number | 是 | 创建时间戳（毫秒） |
| updatedAt | number | 是 | 最后更新时间戳（毫秒） |

约束：
- 新建模式时，settings 取当前 settings 快照；编辑时修改 settings 字段
- **模式快照不含 `language`**：界面语言是全局偏好，不随模式复制/切换（spec F8）
- 删除模式时，若该模式为当前激活模式，则清除 activeModeId
- 模式名称自动生成格式严格为【总{总时长} 单{单边时长} 提{提醒时长}—】，无单位、单字缩写、横杆后用户自填备注

### 当前激活模式

键：`@stretch/activeMode`，值为单个字符串（模式 id 或 null）。

- null 表示使用默认设置（非任何模式）
- 切换模式时写入对应 id；清除时写入 null
- 激活模式切换时，settings 自动更新为该模式的 settings 快照

## 4. 关系

- 无外键关系：settings 为全局单例；history 为独立记录集合，与 settings 无引用关系（历史记录存快照，避免设置变更影响历史）。
- 数据流（plan.md 一致）：SettingsContext 管 settings，HistoryContext 管 history，两键独立读写。
