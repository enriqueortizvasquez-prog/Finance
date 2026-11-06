package pe.edward.finanzas;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/** Cola de notificaciones de pagos guardada en un archivo privado de la app. */
final class NotifStore {
    private static final String FILE = "notif_queue.json";
    private static final String RECENT = "notif_recent.json";
    private static final Object LOCK = new Object();

    private NotifStore() {}

    static void add(Context ctx, String pkg, String title, String text, long time) {
        synchronized (LOCK) {
            try {
                String key = pkg + "|" + text;
                long now = System.currentTimeMillis();
                // Android a veces publica la misma notificación varias veces: se ignoran repetidas en 10 minutos
                JSONArray recent = read(ctx, RECENT);
                JSONArray keep = new JSONArray();
                for (int i = 0; i < recent.length(); i++) {
                    JSONObject r = recent.getJSONObject(i);
                    if (now - r.optLong("t") < 10 * 60 * 1000L) {
                        if (key.equals(r.optString("k"))) return;
                        keep.put(r);
                    }
                }
                keep.put(new JSONObject().put("k", key).put("t", now));
                write(ctx, RECENT, keep);

                JSONArray q = read(ctx, FILE);
                q.put(new JSONObject().put("pkg", pkg).put("title", title).put("text", text).put("time", time));
                // como máximo 200 pendientes
                if (q.length() > 200) {
                    JSONArray cut = new JSONArray();
                    for (int i = q.length() - 200; i < q.length(); i++) cut.put(q.get(i));
                    q = cut;
                }
                write(ctx, FILE, q);
            } catch (Exception ignored) {}
        }
    }

    static JSONArray drain(Context ctx) {
        synchronized (LOCK) {
            JSONArray q = read(ctx, FILE);
            write(ctx, FILE, new JSONArray());
            return q;
        }
    }

    static String readText(Context ctx, String name) {
        try {
            File f = new File(ctx.getFilesDir(), name);
            if (!f.exists()) return null;
            byte[] buf = new byte[(int) f.length()];
            try (FileInputStream in = new FileInputStream(f)) {
                int off = 0;
                while (off < buf.length) {
                    int n = in.read(buf, off, buf.length - off);
                    if (n < 0) break;
                    off += n;
                }
            }
            return new String(buf, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    static void writeText(Context ctx, String name, String value) {
        try {
            File tmp = new File(ctx.getFilesDir(), name + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(value.getBytes(StandardCharsets.UTF_8));
            }
            File dst = new File(ctx.getFilesDir(), name);
            if (!tmp.renameTo(dst)) {
                try (FileOutputStream out = new FileOutputStream(dst)) {
                    out.write(value.getBytes(StandardCharsets.UTF_8));
                }
                tmp.delete();
            }
        } catch (Exception ignored) {}
    }

    private static JSONArray read(Context ctx, String name) {
        try {
            String s = readText(ctx, name);
            return s == null || s.isEmpty() ? new JSONArray() : new JSONArray(s);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static void write(Context ctx, String name, JSONArray a) {
        writeText(ctx, name, a.toString());
    }
}
