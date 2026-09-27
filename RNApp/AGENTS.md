# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## 本项目自定义 config plugin（改前先看）

- `plugins/withAndroidAppLocales.js`：prebuild 之后生成 `android/app/src/main/res/values-en/strings.xml`（桌面图标名 `app_name`，spec F8 多语言）。
- **`android/app/src/main/res/values-*/` 下的手改文件不是真源**：`eas build --local` 会在临时目录重跑 prebuild 冲掉它们（T13 曾因此漏进 APK）。要改 app 标签就改 `plugins/withAndroidAppLocales.js`，并确认 `app.json` 的 `plugins` 数组已注册。
