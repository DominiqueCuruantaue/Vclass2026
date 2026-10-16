package mz.co.vclass.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // Uma app não faz zoom com dois dedos nem tem controlos de zoom.
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        // O tamanho de letra do sistema não reescala o layout da WebView
        // (com letra "Grande" no Android os ecrãs partiam-se como num site).
        settings.setTextZoom(100);

        // Fundo branco enquanto a página seguinte carrega (sem flash preto).
        webView.setBackgroundColor(Color.WHITE);

        // Sem barras de scroll de browser; o feedback de scroll é o nativo.
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
    }
}
