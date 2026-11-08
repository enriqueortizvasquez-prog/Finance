package pe.edward.finanzas;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FinanzasPlugin.class);
        super.onCreate(savedInstanceState);
        // El diseño tiene medidas exactas: si Android agranda la letra del sistema, los números se salen de los círculos.
        try { getBridge().getWebView().getSettings().setTextZoom(100); } catch (Exception ignored) {}
        handleAction(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleAction(intent);
    }

    /** El widget abre la app con "finanzas_action" = "add" para registrar un gasto. */
    private void handleAction(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra(FinanzasPlugin.EXTRA_ACTION);
        if (action != null) {
            intent.removeExtra(FinanzasPlugin.EXTRA_ACTION);
            FinanzasPlugin.setPendingAction(action);
        }
    }
}
