# CODE REVIEW

- Task: T14 界面语言增「跟随系统」（基线 PRODUCT_PLAN V1.8，依赖 T13）
- Commit: 未提交（working tree diff，main 分支，branch up to date with origin/main）
- Reviewer: code-reviewer（codebuddy/glm-5.3-flash）
- Result: 过（PASS，无 P0/P1）

## 核查清单结论（8 项）

1. **resolveLanguage 纯函数正确性 — 已核查通过**
   `RNApp/src/i18n/index.tsx:65-72`。`split(/[-_]/)` 同时覆盖 `zh-Hans-CN` 与 `en_US`；`.trim().toLowerCase()` 归一大小写与空白；tag 为 `null`/`undefined`/`''` 时 `?? ''` → 前缀 `''` → 不命中 → 回落 `'zh'`（index.tsx:70-71）；非支持语言（如 `ja-JP` → `ja`）不命中 → 回落 `'zh'`；手动码 `code !== 'system'` 原样返回（index.tsx:69）。`FOLLOWABLE_CODES` 由 `LANGUAGES` 推导（index.tsx:55-57），加 ja 一行后 `ja-JP`/`zh-CN`/`en-US` 自动对，无需改解析逻辑。

2. **实时性 — 已核查通过（附 P2-1 边界注记）**
   `settings.language` 变 → SettingsContext 重渲染 → `I18nProvider` 重渲染 → `resolveLanguage` 每次 render 重新计算（index.tsx:122-124），不是只在启动算一次；选「跟随系统」立即按系统语言生效，重渲染链路成立（useMemo 依赖 `[language]`，index.tsx:126-132）。系统 tag 在组件内 `useState` 惰性读取一次（index.tsx:123），未读到模块顶层；可用 `systemLocaleTag` prop 注入便于单测（index.tsx:117,124）。边界见 P2-1。

3. **expo-localization 接入 — 已核查通过（附 P2-2 构建链注记）**
   版本 `~57.0.2`（package.json:13）与 SDK 57 的 `node_modules/expo/bundledNativeModules.json` 期望值**逐字一致**（`expo install` 自动选版，非手写）。`app.json:35` plugins 已注册 `"expo-localization"`。
   **android/ 是否需重新生成（关键判断）**：`android/` 目录已存在且入库；`android/settings.gradle:13,22` 使用 `expo-modules-autolinking`，在 gradle 配置期动态扫描 `node_modules`，因此**下一次本地 gradle 构建会自动链上 expo-localization 的原生模块（`expo-module.config.json` 声明 `expo.modules.localization.LocalizationModule`），`getLocales()` 可用，不需要为 JS API 生效而重新 prebuild**。但 config plugin 的副作用（默认 `allowDynamicLocaleChangesAndroid: true` 会给 MainActivity 的 `android:configChanges` 追加 `|locale|layoutDirection`，见 `expo-localization/plugin/build/withExpoLocalization.js`）**只在 prebuild 时落地**：现有入库 manifest（`android/app/src/main/AndroidManifest.xml:28`）无 `locale` 项，直接对入库 android/ 构建（如 `expo run:android`）不会带上该改动；`eas build --local` 会按 plan.md V1.7 记录在临时目录重跑 prebuild，会带上。两条构建路径行为有差异 → P2-2。
   configChanges 对「不重启 App」目标无副作用：F8 的「不重启」指 **App 内切换语言**（纯 React 重渲染，与 configChanges 无关）；configChanges 的 `locale` 项只影响**系统语言变化时 Activity 是否重建**，见 P2-1。

4. **类型与文案 — 已核查通过**
   无 `as any`/`: any`（grep 三文件零命中）。`LanguageEntry` 为字面量判别联合，`languageLabel`（index.tsx:75-77）靠 `lang.code === 'system'` 判别收窄，else 分支 label 为 `'中文' | 'English'` 字符串，无 null 逃逸；`STRINGS` 聚合跳过 `strings: null` 伪项（index.tsx:79-82），`STRINGS` 永不含 `system` 键；`translate` 参数类型收窄为 `SupportedLanguageCode`（index.tsx:88），双重兜底 `STRINGS[language] ?? STRINGS.zh` + `table[key] ?? zh[key] ?? key` 无崩溃路径。`strings.en.ts:1` 仍为 `Record<StringKey, string>` 全约束（漏翻 tsc 报错，本次 tsc 通过即证两边齐）。`settings.language.system` 两边均已补：zh `'跟随系统'`（strings.zh.ts:74）、en `'Follow system'`（strings.en.ts:78）。diff 中无残留写死中文的用户可见文案（仅注释）。

5. **存量数据兼容 — 已核查通过**
   `DEFAULT_SETTINGS.language = 'system'`（SettingsContext.tsx:35）；加载合并 `{ ...DEFAULT_SETTINGS, ...parsed }`（SettingsContext.tsx:97）——老用户已存 `'zh'`/`'en'` 原样保留，缺字段按 `'system'`。`settingsToModeSettings` 刻意不带 language（SettingsContext.tsx:58-69），`'system'` 不会写进模式快照；`modeSettingsToSettings` 显式带回当前语言（SettingsContext.tsx:75-81,176），切模式/启用模式不会把语言打回跟随。

6. **设置页渲染 — 已核查通过**
   三项按 `LANGUAGES` 顺序渲染，`system` 首位（index.tsx:39-43 → SettingsScreen.tsx:235-243）；高亮判定 `settings.language === lang.code`（SettingsScreen.tsx:239）与伪项兼容；伪项文案经 `languageLabel` 走 `t()`（SettingsScreen.tsx:240），随界面语言显示「跟随系统 / Follow system」。溢出风险：Group 统一容器 `chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }`（SettingsScreen.tsx:641），"Follow system" 过宽时自动换行，无溢出；与主题分组等既有 Chip 风格完全一致。

7. **回归 — 已核查通过**
   业务 diff 仅 i18n/index.tsx、strings.zh/en.ts、SettingsScreen.tsx、SettingsContext.tsx + package.json/app.json；计时、音效、主题、模式、历史逻辑零改动（SettingsContext 其余函数未动）。package-lock.json diff 为纯新增（`expo-localization@57.0.2` + 传递依赖 `rtl-detect@1.1.2`），无删改。直接新增依赖仅 1 个（rtl-detect 为其传递依赖，非独立引入）。docs/ 改动为 spec/plan/data-model/tasks 的 **V1.8 基线变更记录与 T14 任务行**，属 planner 基线更新非 builder 越界。未 commit/push（工作区改动未暂存，远端无新提交）。无写死颜色。

8. **tsc — 已核查通过**
   `cd RNApp && npx tsc --noEmit` 退出码 **0**。

## P0 / P1 Findings

- 无。

## P2 / P3 Backlog Findings

- **P2-1｜RNApp/src/i18n/index.tsx:123｜系统语言运行期变化不感知**
  问题：`detectedTag` 在 Provider 挂载时一次性读取，运行期系统语言变化不会重读。
  为什么重要：expo-localization 的 config plugin 默认 `allowDynamicLocaleChangesAndroid: true`，prebuild 后 manifest 的 configChanges 含 `locale` → 系统语言变化时 Activity **不重建**，App 存活期间「跟随系统」不会随系统语言变化更新（直到杀 App 重开）。当前入库 manifest 无 `locale`（Activity 会重建、重挂载重读，行为正确），但走 `eas build --local` 后两条路径行为分叉。
  建议：把 `useState(() => getLocales()[0]?.languageTag)` 换成 expo-localization 自带的 `useLocales()[0]?.languageTag`（内部经 `addLocaleListener` 订阅、变化即重渲染，见 `expo-localization/src/Localization.ts:74-83`），一行改动即全路径一致；或真机确认后明确接受此边界。
- **P2-2｜RNApp/android/（未改动）｜本地构建与 eas 构建的 plugin 副作用不同步**
  问题：config plugin 的 manifest 改动只在 prebuild 落地，入库 android/ 与 eas 临时 prebuild 结果将不一致（`eas build --local` 会带上 `|locale|layoutDirection`，本地直构不带）。
  为什么重要：下次真机 QA 若用 `expo run:android` 直构，验的是「无 plugin 副作用」的版本；发布走 eas，验的是另一版本，QA 结论可能与线上不完全等价（本任务功能本身两条路径都能用，仅 configChanges 副作用不同）。
  建议：下次构建前跑一次 `npx expo prebuild -p android` 同步入库目录，或在 HANDOFF 记一句「T14 起本地直构不含 expo-localization plugin 副作用，验收以 eas 构建为准」。
- **P3｜RNApp/src/i18n/index.tsx:69｜脏数据自愈依赖 translate 兜底**
  若持久化出现联合类型之外的值（理论不可能，UI 只写合法码），`resolveLanguage` 会原样返回，靠 `translate` 的 `STRINGS[language] ?? STRINGS.zh` 兜底，无崩溃。属既有兜底链路，无需改动，记录备查。

## 总体结论

**PASS**（无 P0、无 P1；两个 P2 均不阻塞本任务 DoD，可作 backlog 跟进）
