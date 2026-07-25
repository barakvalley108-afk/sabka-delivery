package com.sabkadelivery.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

/** Forces Android to show only installed apps that can handle a UPI payment. */
public class UpiChooserActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri incoming = getIntent().getData();
        if (incoming == null || !"sabka-upi".equals(incoming.getScheme())) {
            finish();
            return;
        }

        Uri upiUri = incoming.buildUpon().scheme("upi").build();
        Intent payment = new Intent(Intent.ACTION_VIEW, upiUri);

        PackageManager packages = getPackageManager();
        if (packages.queryIntentActivities(payment, PackageManager.MATCH_DEFAULT_ONLY).isEmpty()) {
            Toast.makeText(this, "Koi UPI app installed nahi mila", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        try {
            startActivity(Intent.createChooser(payment, "Choose installed UPI app"));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "UPI app open nahi ho saka", Toast.LENGTH_LONG).show();
        }
        finish();
    }
}
