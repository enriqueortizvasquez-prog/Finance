package pe.edward.finanzas;

import android.Manifest;
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
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.UtteranceProgressListener;
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
import com.getcapacitor.PermissionState;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Locale;

/** Funciones del celular para la app: huella, notificaciones, widget, archivos y voz. */
@CapacitorPlugin(
    name = "Finanzas",
    permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "mic") }
)
public class FinanzasPlugin extends Plugin {
    static final String EXTRA_ACTION = "finanzas_action";
    private static FinanzasPlugin instance;
    private static String pendingAction;

    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String ttsPending;
    private String ttsPendingId;
    private int uttSeq = 0;
    private final Map<String, PluginCall> speakCalls = new HashMap<>();

    private SpeechRecognizer recognizer;
    private PluginCall listenCall;
    private long lastLevel = 0;

    @Override
    public void load() {
        instance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) tts.shutdown();
        resolveAllSpeak();
        if (recognizer != null) {
            try { recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
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

    /* ---------- conversación por voz: escuchar sin ventanas ---------- */
    @PluginMethod
    public void voiceListen(PluginCall call) {
        if (getPermissionState("mic") != PermissionState.GRANTED) {
            requestPermissionForAlias("mic", call, "micPermResult");
            return;
        }
        startRecognizer(call);
    }

    @PermissionCallback
    private void micPermResult(PluginCall call) {
        if (getPermissionState("mic") == PermissionState.GRANTED) {
            startRecognizer(call);
        } else {
            JSObject r = new JSObject();
            r.put("text", "");
            r.put("error", "perm");
            call.resolve(r);
        }
    }

    private void startRecognizer(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            finishListen("", "cancel");
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                JSObject r = new JSObject();
                r.put("text", "");
                r.put("error", "unavailable");
                call.resolve(r);
                return;
            }
            try {
                if (recognizer == null) {
                    recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                    recognizer.setRecognitionListener(new Listener());
                }
                listenCall = call;
                Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-PE");
                i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
                i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1300L);
                i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1300L);
                recognizer.startListening(i);
            } catch (Exception e) {
                if (recognizer != null) {
                    try { recognizer.destroy(); } catch (Exception ignored) {}
                    recognizer = null;
                }
                finishListen("", "fail");
            }
        });
    }

    private void finishListen(String text, String error) {
        PluginCall c = listenCall;
        listenCall = null;
        if (c == null) return;
        JSObject r = new JSObject();
        r.put("text", text == null ? "" : text);
        if (error != null) r.put("error", error);
        c.resolve(r);
    }

    private void voiceEvent(String type, String key, Object value) {
        JSObject e = new JSObject();
        e.put("type", type);
        if (key != null) e.put(key, value);
        notifyListeners("voice", e);
    }

    private class Listener implements RecognitionListener {
        @Override public void onReadyForSpeech(Bundle params) { voiceEvent("ready", null, null); }
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {
            long t = System.currentTimeMillis();
            if (t - lastLevel < 90) return;
            lastLevel = t;
            voiceEvent("level", "v", rmsdB);
        }
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onError(int error) {
            String e;
            switch (error) {
                case SpeechRecognizer.ERROR_NO_MATCH:
                case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: e = "silence"; break;
                case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: e = "perm"; break;
                case SpeechRecognizer.ERROR_NETWORK:
                case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: e = "network"; break;
                case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                    if (recognizer != null) {
                        try { recognizer.destroy(); } catch (Exception ignored) {}
                        recognizer = null;
                    }
                    e = "busy"; break;
                default: e = "fail";
            }
            finishListen("", e);
        }
        @Override public void onResults(Bundle results) {
            ArrayList<String> m = results == null ? null : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            finishListen(m != null && !m.isEmpty() ? m.get(0) : "", null);
        }
        @Override public void onPartialResults(Bundle partial) {
            ArrayList<String> m = partial == null ? null : partial.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (m != null && !m.isEmpty() && m.get(0) != null && !m.get(0).isEmpty()) voiceEvent("partial", "text", m.get(0));
        }
        @Override public void onEvent(int eventType, Bundle params) {}
    }

    /** Termina de escuchar ya y entrega lo que oyó. */
    @PluginMethod
    public void voiceFinish(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null && listenCall != null) {
                try { recognizer.stopListening(); } catch (Exception ignored) {}
            }
        });
        call.resolve();
    }

    /** Cancela la escucha sin entregar nada. */
    @PluginMethod
    public void voiceStop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) {
                try { recognizer.cancel(); } catch (Exception ignored) {}
            }
            finishListen("", "stopped");
        });
        call.resolve();
    }

    /* ---------- voz de Lizi (texto a voz); con wait:true responde cuando termina de hablar ---------- */
    private void resolveSpeak(String id) {
        PluginCall c;
        synchronized (speakCalls) { c = speakCalls.remove(id); }
        if (c != null) c.resolve();
    }

    private void resolveAllSpeak() {
        ArrayList<PluginCall> all;
        synchronized (speakCalls) {
            all = new ArrayList<>(speakCalls.values());
            speakCalls.clear();
        }
        for (PluginCall c : all) c.resolve();
    }

    private void setupVoice() {
        // voz latinoamericana: primero español de EE. UU./México/Perú, luego cualquier español
        Locale[] prefs = { new Locale("es", "US"), new Locale("es", "MX"), new Locale("es", "PE"), new Locale("es", "419"), new Locale("es") };
        boolean ok = false;
        for (Locale l : prefs) {
            int a = tts.isLanguageAvailable(l);
            if (a >= TextToSpeech.LANG_COUNTRY_AVAILABLE || (l.getCountry().isEmpty() && a >= TextToSpeech.LANG_AVAILABLE)) {
                int res = tts.setLanguage(l);
                if (res != TextToSpeech.LANG_MISSING_DATA && res != TextToSpeech.LANG_NOT_SUPPORTED) { ok = true; break; }
            }
        }
        if (!ok) tts.setLanguage(new Locale("es"));
        tts.setPitch(1.06f);
        tts.setSpeechRate(1.05f);
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String utteranceId) { voiceEvent("speaking", null, null); }
            @Override public void onDone(String utteranceId) { resolveSpeak(utteranceId); }
            @Override public void onError(String utteranceId) { resolveSpeak(utteranceId); }
            @Override public void onError(String utteranceId, int errorCode) { resolveSpeak(utteranceId); }
            @Override public void onStop(String utteranceId, boolean interrupted) { resolveSpeak(utteranceId); }
        });
    }

    private void say(String text, String id) {
        int r = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
        if (r != TextToSpeech.SUCCESS) resolveSpeak(id);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String id = "lizi" + (++uttSeq);
        if (Boolean.TRUE.equals(call.getBoolean("wait", false)) && !text.isEmpty()) {
            synchronized (speakCalls) { speakCalls.put(id, call); }
        } else {
            call.resolve();
        }
        if (text.isEmpty()) return;
        if (tts == null) {
            ttsPending = text;
            ttsPendingId = id;
            tts = new TextToSpeech(getContext(), status -> {
                ttsReady = status == TextToSpeech.SUCCESS;
                if (ttsReady) {
                    setupVoice();
                    if (ttsPending != null) say(ttsPending, ttsPendingId);
                } else {
                    resolveAllSpeak();
                }
                ttsPending = null;
            });
        } else if (ttsReady) {
            say(text, id);
        } else {
            if (ttsPendingId != null) resolveSpeak(ttsPendingId);
            ttsPending = text;
            ttsPendingId = id;
        }
    }

    @PluginMethod
    public void stopSpeak(PluginCall call) {
        if (tts != null) tts.stop();
        ttsPending = null;
        resolveAllSpeak();
        call.resolve();
    }
}
