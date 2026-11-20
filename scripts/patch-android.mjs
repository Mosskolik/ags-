// Capacitor'ın oluşturduğu Android projesine Hedef AGS'nin yerel parçalarını ekler.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const app = path.join(root, 'android/app/src/main');
const pkgDir = path.join(app, 'java/com/mosskolik/hedefags');

fs.cpSync(path.join(root, 'android-extra/res'), path.join(app, 'res'), { recursive: true });
fs.cpSync(path.join(root, 'android-extra/java/com/mosskolik/hedefags'), pkgDir, { recursive: true });

const mf = path.join(app, 'AndroidManifest.xml');
let x = fs.readFileSync(mf, 'utf8');
if (!x.includes('xmlns:tools')) x = x.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android"', '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"');

const perms = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_CALENDAR',
  'android.permission.WRITE_CALENDAR',
  'com.android.alarm.permission.SET_ALARM',
  'android.permission.KILL_BACKGROUND_PROCESSES'
].map((p) => `    <uses-permission android:name="${p}" />`).join('\n');
const usage = '    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />';

const components = `
        <receiver android:name=".HedefWidget" android:exported="false" android:label="Hedef AGS">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_hedef_info" />
        </receiver>
        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter>
        </receiver>
        <service android:name=".FocusGuardService" android:exported="false" android:foregroundServiceType="specialUse">
            <property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="Kullanıcının açtığı odak modu: çalışma saatinde dikkat dağıtan uygulamalar için hatırlatma" />
        </service>
`;
if (!x.includes('.FocusGuardService')) {
  x = x.replace('</application>', components + '    </application>');
  x = x.replace('</manifest>', `${perms}\n${usage}\n</manifest>`);
}
fs.writeFileSync(mf, x);
console.log('Android projesi yamalandı');
