package com.mosskolik.hedefags;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Telefon yeniden başlayınca widget'ı tazeler ve odak bekçisini yeniden başlatır. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        HedefWidget.updateAll(context);
        FocusGuardService.sync(context);
    }
}
