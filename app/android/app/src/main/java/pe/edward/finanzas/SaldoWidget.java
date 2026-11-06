package pe.edward.finanzas;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Widget de la pantalla de inicio: saldo total, gasto del mes y botón + para registrar. */
public class SaldoWidget extends AppWidgetProvider {
    static final String PREFS = "finanzas_widget";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    static void updateAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, SaldoWidget.class));
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    static RemoteViews build(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_saldo);
        String total = p.getString("total", "");
        v.setTextViewText(R.id.w_label, p.getString("label", "en tus cuentas"));
        v.setTextViewText(R.id.w_total, total.isEmpty() ? "Abre Finanzas" : total);
        v.setTextViewText(R.id.w_sub, p.getString("sub", "Toca para empezar"));
        v.setInt(R.id.w_bg, "setColorFilter", p.getInt("tile", 0xFF0F0F0F));
        v.setInt(R.id.w_plus_bg, "setColorFilter", p.getInt("accent", 0xFFD0D0D0));
        v.setInt(R.id.w_plus_icon, "setColorFilter", 0xFF000000);
        v.setTextColor(R.id.w_total, p.getInt("text", 0xFFEDEDED));
        v.setTextColor(R.id.w_label, p.getInt("muted", 0xFF767676));
        v.setTextColor(R.id.w_sub, p.getInt("muted", 0xFF767676));

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        Intent open = new Intent(ctx, MainActivity.class);
        open.setAction(Intent.ACTION_MAIN);
        open.addCategory(Intent.CATEGORY_LAUNCHER);
        v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(ctx, 10, open, flags));

        Intent add = new Intent(ctx, MainActivity.class);
        add.setAction("pe.edward.finanzas.REGISTRAR");
        add.putExtra(FinanzasPlugin.EXTRA_ACTION, "add");
        v.setOnClickPendingIntent(R.id.w_plus, PendingIntent.getActivity(ctx, 11, add, flags));
        return v;
    }
}
