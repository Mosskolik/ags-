package com.mosskolik.hedefags;

import android.content.Intent;
import android.os.Bundle;

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
        if (tab != null && tab.matches("[a-z]+")) HedefState.prefs(this).edit().putString("openTab", tab).apply();
    }

    @Override
    public void onPause() {
        super.onPause();
        HedefWidget.updateAll(this);
    }
}
