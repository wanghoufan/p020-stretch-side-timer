# CODE REVIEW｜T13 界面多语言（中文/英文）

> 日期：2026-09-27 ｜ 评审人：code-reviewer（codebuddy/glm-5.3-flash）｜ 独立 Session
> 依据：spec.md V1.7 F8 及 DoD 表、plan.md V1.7、data-model.md language 行、tasks.md T13 行、DEV_BASELINE=PRODUCT_PLAN V1.7

## 一、评审范围

- 新增：`RNApp/src/i18n/index.tsx`、`strings.zh.ts`、`strings.en.ts`、`RNApp/android/app/src/main/res/values-en/strings.xml`
- 修改：`RNApp/App.tsx`、`src/store/SettingsContext.tsx`、`src/constants.ts`、`src/theme/themes.ts`、`src/navigation/BottomTabs.tsx`、`src/screens/TimerScreen.tsx`、`src/screens/SettingsScreen.tsx`、`src/screens/HistoryScreen.tsx`、`src/components/Pet.tsx`
- 方式：`git diff` + `git status` + 逐文件 Read 全貌；只评 RNApp/ 代码，未动 docs/。

## 二、必查清单结论（逐条）

| # | 检查项 | 结论 |
|---|---|---|
| 1 | 文案覆盖率 | **已核查通过**。全仓扫描（`grep [一-龥]`）排除 strings 表后仅剩注释；用户可见文字全部走 `t()`：tab 标题、三页头/按钮/空状态/删除清空、模式卡与 Modal 全部字段、自动生成模板（中【总X 单Y 提Z—】/英 [TX SY AZ—]）、时长档位、speedHint、tip。无 Alert 组件使用。允许保留项确认合规：strings.zh.ts 本身、4 首轻音乐中文注解、MUSIC_ATTRIBUTION 正文（英文原文未删减）、values/strings.xml 中文 app_name、LANGUAGES 语言自称（中文/English，语言表常量非界面文案） |
| 2 | 漏翻类型兜底 | **已核查通过**。`strings.en.ts:17` 为 `Record<StringKey, string>`（StringKey 来自 zh 表 keyof 推导），漏 key / 多写 key 均 tsc 报错。音效/动物/主题/背景音/单边档位均有 `Record<Id, StringKey>` 映射（index.tsx:98-139），constants 里新增 id 而不登记映射即编译失败。tsc 实跑通过 |
| 3 | 立即生效不破坏状态 | **已核查通过**。App.tsx Provider 顺序 Settings→I18n→History→Navigator，无 `key` 强制重挂载；切语言仅 context 值变化触发重渲染，元素树结构不变，React reconcile 不 remount：useTimer 内部 state/ref 保留（计时/暂停/背景音逻辑不依赖语言）、NavigationContainer 状态不重置。I18nProvider 的 `t` 用 useMemo 包裹且依赖 `[language]` 正确 |
| 4 | 持久化与兼容 | **已核查通过**。`language` 存 `@stretch/settings`，加载合并 `{...DEFAULT_SETTINGS, ...parsed}`：旧数据缺字段回落 `'zh'`，顺序正确。`settingsToModeSettings` 显式字段清单不含 language；`createMode` 基线改用 `DEFAULT_MODE_SETTINGS`（不含 language）——模式快照永不携带语言，符合 spec F8/data-model 禁止项。`modeSettingsToSettings` 显式回填当前 `settings.language`，切模式不会把界面打回中文。Modal 内 modeSettings 虽经 `setModeSettings(settings)` 带入 language 字段，但 `saveMode` 显式重建 8 字段 fullSettings，language 不落快照 |
| 5 | 数据安全 | **已核查通过**。3 个 AsyncStorage 键（settings/modes/activeMode）读写路径未改；history 未触碰；update 仍整体序列化 settings 写回。合并顺序 defaults→parsed 正确 |
| 6 | 架构扩展性 | **已核查通过**。加第三语言 = 新建 `strings.<code>.ts`（标 `Record<StringKey, string>`）+ LANGUAGES 加一行；`LanguageCode` 由 LANGUAGES 推导自动扩展。store 反向引用 LanguageCode 用 `import type` 编译期擦除，无运行期环。页面无任何语言相关逻辑（copy 后缀由 UI 传 `t('settings.modeCopySuffix')` 即此设计的正确用法） |
| 7 | 质量细节 | 基本**通过**，2 条 P2（错误提示函数名不符 index.tsx:85；英文长文案/全角括号见问题表）。无 `as any`；无死代码；`TFn` 导出被 HistoryScreen 复用；tsc strict 通过 |
| 8 | 回归风险 | **已核查通过**。BACKGROUND_SOUNDS group → 'ambient'/'music'：全部 filter 点（主列表 2 处 + Modal 2 处）与 previewBackground 的 `=== 'music'` 已同步，grep 无 '环境音'/'轻音乐' 残留（仅注释）。PER_SIDE_OPTIONS → 数字数组：两处 map（主列表 + Modal）均改 `PER_SIDE_LABEL_KEY[v]`，无 `.label`/`.value` 残留。Theme.label / PETS.name / SOUNDS.label / MUSIC_ATTRIBUTION.label 删除后 grep 无引用残留。行为不变（试听时长、分组互斥、关闭全局语义均原样） |
| 9 | 合规 | **已核查通过**。package.json 无新依赖；未改 docs/；颜色全部走 theme token；`git status` 确认未 commit/push（改动未暂存，分支与 origin 一致） |
| 10 | tsc | **通过**：`cd RNApp && npx tsc --noEmit` 退出码 0，无错误 |

## 三、分级问题表

### P0（功能坏/数据坏/构建不过）

无。

### P1（该修但不致命）

无。

### P2（可选优化）

| 文件:行号 | 问题 | 为什么 | 建议 |
|---|---|---|---|
| src/i18n/index.tsx:85 | `useI18n` 内抛错文案为 `'useT must be used within I18nProvider'`，与实际函数名 `useI18n` 不符 | 排查报错时误导定位（提示的 hook 不是抛错者） | 改为 `'useI18n/useT must be used within I18nProvider'` |
| src/i18n/strings.en.ts:64-67 | 英文界面 4 首曲名用全角括号「（）」包裹中文注解（如 `Reawakening（温暖苏醒）`），且为全部 Chip 中最长文案 | 英文语境惯用半角括号；全角混排视觉突兀，长 Chip 在窄屏有换行风险 | 改半角 + 空格：`Reawakening (禅意古筝)`；注解保留中文不变（CC BY 口径不受影响） |
| src/i18n/strings.en.ts:83-84 | `settings.group.ambient/music` 英文标题较长（"Countdown sound (tap to preview, can turn off)"），窄屏会折成两行 | 群组标题折行后与中文版视觉高度不一致 | 可缩短为 `Countdown sound (tap to preview)`，"可关闭"语义由组内 Off Chip 自明 |

（以上均为文案/可读性打磨，不影响功能、数据与构建，不阻塞收工。）

## 四、总体结论

**PASS** —— F8 需求全覆盖：双语言切换立即生效不重挂载（计时/导航状态无感）、持久化兼容旧数据、模式快照不带 language、漏翻由类型系统硬兜底、加第三语言确为「一文件 + 一行」、无新依赖无越界改动、tsc 通过。仅 3 条 P2 文案打磨项，可随下轮顺手处理。

## 五、任务账本

{"task":"T13 界面多语言（中文/英文）","project":"020-ing-拉伸换边app","date":"2026-09-27","role":"code-reviewer","model":"codebuddy/glm-5.3-flash","result":"PASS","rework":0,"escalated":"NO","escalation_reason":null,"tokens":null,"cost_cny":null}
