package pe.edward.finanzas;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;

import androidx.activity.result.ActivityResult;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;

/** Funciones del celular para la app: huella, notificaciones, widget, archivos y voz. */
@CapacitorPlugin(name = "Finanzas")
public class FinanzasPlugin extends Plugin {
    static final String EXTRA_ACTION = "finanzas_action";
    private static FinanzasPlugin instance;
    private static String pendingAction;

    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String ttsPending;

    @Override
    public void load() {
        instance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) tts.shutdown();
        if (instance == this) instance = null;
    }

    static void onNewNotification() {
        FinanzasPlugin p = instance;
        if (p != null) p.notifyListeners("notif", new JSObject());
    }

    static void setPendingAction(String action) {
        pendingAction = action;
        FinanzasPlugin p = instance;
        if (p != null) p.notifyListeners("action", new JSObject());
    }

    @PluginMethod
    public void takeAction(PluginCall call) {
        JSObject r = new JSObject();
        r.put("action", pendingAction);
        pendingAction = null;
        call.resolve(r);
    }

    /* ---------- copia nativa de los datos ---------- */
    private static String kvFile(String key) {
        return "kv_" + key.replaceAll("[^a-zA-Z0-9_-]", "_") + ".json";
    }

    @PluginMethod
    public void kvSet(PluginCall call) {
        String key = call.getString("key", "data");
        String value = call.getString("value", "");
        NotifStore.writeText(getContext(), kvFile(key), value);
        call.resolve();
    }

    @PluginMethod
    public void kvGet(PluginCall call) {
        JSObject r = new JSObject();
        r.put("value", NotifStore.readText(getContext(), kvFile(call.getString("key", "data"))));
        call.resolve(r);
    }

    /* ---------- huella ---------- */
    @PluginMethod
    public void bioAvailable(PluginCall call) {
        int res = BiometricManager.from(getContext()).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK);
        JSObject r = new JSObject();
        r.put("available", res == BiometricManager.BIOMETRIC_SUCCESS);
        call.resolve(r);
    }

    @PluginMethod
    public void bioAuth(PluginCall call) {
        final String title = call.getString("title", "Finanzas");
        final String subtitle = call.getString("subtitle", "");
        Activity a = getActivity();
        if (!(a instanceof FragmentActivity)) {
            JSObject r = new JSObject();
            r.put("ok", false);
            call.resolve(r);
            return;
        }
        final FragmentActivity act = (FragmentActivity) a;
        act.runOnUiThread(() -> {
            try {
                BiometricPrompt prompt = new BiometricPrompt(act, ContextCompat.getMainExecutor(act), new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                        JSObject r = new JSObject();
                        r.put("ok", true);
                        call.resolve(r);
                    }

                    @Override
                    public void onAuthenticationError(int errorCode, CharSequence errString) {
                        JSObject r = new JSObject();
                        r.put("ok", false);
                        r.put("error", String.valueOf(errString));
                        call.resolve(r);
                    }
                });
                BiometricPrompt.PromptInfo.Builder b = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setNegativeButtonText("Usar PIN")
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK);
                if (!subtitle.isEmpty()) b.setSubtitle(subtitle);
                prompt.authenticate(b.build());
            } catch (Exception e) {
                JSObject r = new JSObject();
                r.put("ok", false);
                call.resolve(r);
            }
        });
    }

    /* ---------- notificaciones de pagos ---------- */
    @PluginMethod
    public void notifStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("enabled", NotificationManagerCompat.getEnabledListenerPackages(getContext()).contains(getContext().getPackageName()));
        call.resolve(r);
    }

    @PluginMethod
    public void notifSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            Intent i = new Intent(Settings.ACTION_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
        call.resolve();
    }

    @PluginMethod
    public void notifPending(PluginCall call) {
        JSONArray q = NotifStore.drain(getContext());
        JSArray items = new JSArray();
        for (int i = 0; i < q.length(); i++) items.put(q.opt(i));
        JSObject r = new JSObject();
        r.put("items", items);
        call.resolve(r);
    }

    /* ---------- widget ---------- */
    private static int color(String s, int def) {
        try {
            return s == null || s.isEmpty() ? def : Color.parseColor(s.trim());
        } catch (Exception e) {
            return def;
        }
    }

    @PluginMethod
    public void widgetUpdate(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences.Editor e = ctx.getSharedPreferences(SaldoWidget.PREFS, Context.MODE_PRIVATE).edit();
        e.putString("label", call.getString("label", "en tus cuentas"));
        e.putString("total", call.getString("total", ""));
        e.putString("sub", call.getString("sub", ""));
        e.putInt("accent", color(call.getString("accent"), 0xFFD0D0D0));
        e.putInt("tile", color(call.getString("tile"), 0xFF0F0F0F));
        e.putInt("text", color(call.getString("text"), 0xFFEDEDED));
        e.putInt("muted", color(call.getString("muted"), 0xFF767676));
        e.apply();
        SaldoWidget.updateAll(ctx);
        call.resolve();
    }

    /* ---------- guardar respaldo en Descargas ---------- */
    @PluginMethod
    public void saveFile(PluginCall call) {
        String name = call.getString("name", "finanzas.json");
        String data = call.getString("data", "");
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver cr = getContext().getContentResolver();
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                cv.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                cv.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Finanzas");
                Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) throw new Exception("sin uri");
                try (OutputStream out = cr.openOutputStream(uri)) {
                    if (out == null) throw new Exception("sin salida");
                    out.write(data.getBytes(StandardCharsets.UTF_8));
                }
                JSObject r = new JSObject();
                r.put("path", "Descargas/Finanzas/" + name);
                call.resolve(r);
            } else {
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) dir = getContext().getFilesDir();
                File f = new File(dir, name);
                try (FileOutputStream out = new FileOutputStream(f)) {
                    out.write(data.getBytes(StandardCharsets.UTF_8));
                }
                JSObject r = new JSObject();
                r.put("path", f.getAbsolutePath());
                call.resolve(r);
            }
        } catch (Exception e) {
            call.reject("No se pudo guardar: " + e.getMessage());
        }
    }

    /* ---------- dictado (voz a texto) ---------- */
    @PluginMethod
    public void listen(PluginCall call) {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-PE");
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Dime qué anotar");
        try {
            startActivityForResult(call, i, "listenResult");
        } catch (ActivityNotFoundException e) {
            call.reject("Este celular no tiene dictado por voz");
        }
    }

    @ActivityCallback
    private void listenResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject r = new JSObject();
        String text = "";
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            ArrayList<String> m = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (m != null && !m.isEmpty()) text = m.get(0);
        }
        r.put("text", text);
        call.resolve(r);
    }

    /* ---------- voz (texto a voz) ---------- */
    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        if (tts == null) {
            ttsPending = text;
            tts = new TextToSpeech(getContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    int res = tts.setLanguage(new Locale("es", "PE"));
                    if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(new Locale("es"));
                    if (ttsPending != null) tts.speak(ttsPending, TextToSpeech.QUEUE_FLUSH, null, "jarvis");
                    ttsPending = null;
                }
            });
        } else if (ttsReady) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "jarvis");
        } else {
            ttsPending = text;
        }
        call.resolve();
    }
}
