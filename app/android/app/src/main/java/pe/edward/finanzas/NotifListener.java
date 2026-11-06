package pe.edward.finanzas;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Lee las notificaciones de Yape y de los bancos (solo esas apps) y guarda las que traen un monto.
 * La app las convierte en movimientos la próxima vez que se abre (o al instante si está abierta).
 */
public class NotifListener extends NotificationListenerService {
    private static final String[] APPS = {
        "yape", "bcp", "interbank", "ibk", "bbva", "scotiabank", "lemon", "plin", "tunki",
        "bancodelanacion", "bn.pe", "banbif", "pichincha", "falabella", "ripley", "mibanco", "cajahuancayo", "agora"
    };
    private static final Pattern MONEY = Pattern.compile("(?s).*(S/|US\\$|\\$)\\s?\\d.*");

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            String pkg = sbn.getPackageName();
            if (pkg == null || pkg.equals(getPackageName())) return;
            String lp = pkg.toLowerCase(Locale.ROOT);
            boolean known = false;
            for (String a : APPS) {
                if (lp.contains(a)) { known = true; break; }
            }
            if (!known) return;
            Notification n = sbn.getNotification();
            if (n == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
            Bundle ex = n.extras;
            if (ex == null) return;
            CharSequence title = ex.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence text = ex.getCharSequence(Notification.EXTRA_BIG_TEXT);
            if (text == null) text = ex.getCharSequence(Notification.EXTRA_TEXT);
            if (text == null) return;
            String t = title == null ? "" : title.toString();
            String body = text.toString();
            if (!MONEY.matcher(t + " " + body).matches()) return;
            NotifStore.add(getApplicationContext(), pkg, t, body, sbn.getPostTime());
            FinanzasPlugin.onNewNotification();
        } catch (Exception ignored) {}
    }
}
