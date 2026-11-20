package com.mosskolik.hedefags;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HedefPlugin.class);
        rememberTab(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        rememberTab(intent);
        super.onNewIntent(intent);
    }

    /** Widget'a dokunulunca hangi sekmenin açılacağını uygulamaya iletir. */
    private void rememberTab(Intent intent) {
        if (intent == null) return;
        String tab = intent.getStringExtra("tab");
        if (tab != null && tab.matches("[a-z]+")) {
            android.content.SharedPreferences.Editor e = HedefState.prefs(this).edit().putString("openTab", tab);
            String reason = intent.getStringExtra("reason");
            if (reason != null && reason.matches("[a-z-]+")) e.putString("openReason", reason);
            e.apply();
        }
        if (intent.getBooleanExtra("alarm", false)) showOverLockScreen();
    }

    /** Alarm çaldığında uygulama kilit ekranının üstünde açılır ve ekranı yakar. */
    private void showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        HedefWidget.updateAll(this);
    }
}
