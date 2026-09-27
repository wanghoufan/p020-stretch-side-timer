const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const APP_NAME_EN = 'Stretch Timer';

/**
 * 在 android prebuild 之后写入 app/src/main/res/values-en/strings.xml，
 * 让英文系统下的桌面图标名称显示为 Stretch Timer（而不是 fallback 到中文）。
 *
 * 背景：eas build --local 会在临时目录重新 prebuild，手写的 res 文件会被冲掉，
 * 所以 values-en/strings.xml 的真源必须是本插件（RNApp/android/.../values-en/strings.xml
 * 仅作为本地不走 prebuild 直接 gradle 构建时的回退副本）。
 */
module.exports = function withAndroidAppLocales(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const resDir = path.join(projectRoot, 'app', 'src', 'main', 'res', 'values-en');
      await fs.promises.mkdir(resDir, { recursive: true });
      const content =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<resources>\n' +
        '  <!-- 由 plugins/withAndroidAppLocales.js 在 prebuild 时生成，勿手改 -->\n' +
        `  <string name="app_name">${APP_NAME_EN}</string>\n` +
        '</resources>\n';
      await fs.promises.writeFile(path.join(resDir, 'strings.xml'), content, 'utf8');
      return config;
    },
  ]);
};
