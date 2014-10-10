package com.skvallra.activities;

import android.app.Activity;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.skvallra.utilities.AppState;
import com.skvallra.utilities.BlurTransform;
import com.skvallra.R;
import com.skvallra.api.SkvallraApi;
import com.squareup.picasso.Picasso;

import java.io.IOException;

import butterknife.ButterKnife;
import butterknife.InjectView;

public class LoginActivity extends Activity {

    private static final String LOG_TAG = "Login Activity";
    @InjectView(R.id.username) EditText username;
    @InjectView(R.id.password) EditText password;
    @InjectView(R.id.login) Button loginButton;
    @InjectView(R.id.relative_layout) RelativeLayout layout;
    @InjectView(R.id.backgroundImage) ImageView background;
    @InjectView(R.id.login_failed) TextView loginFailed;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        ButterKnife.inject(this);
        Picasso.with(this).load(R.drawable.background).fit().transform(new BlurTransform(this)).into(background);

        Log.d(LOG_TAG, "Starting Skvallra");

        //*
        // Enable this block for testing without logging in
        completeLogin("20b918186fcb94ad34ba462e4044680f42e7fb31");
        //*/
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.login, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();
        if (id == R.id.action_settings) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    public void login(View view) {
        Log.d(LOG_TAG, "Logging in to Skvallra");

        String key = username.getText().toString();
        String secret = password.getText().toString();

        Log.d(LOG_TAG, "Key : " + key);
        Log.d(LOG_TAG, "Secret : " + secret);

        String auth[] = {key, secret};
        new GetAccessTokenTask().execute(auth);
    }

    public void completeLogin(String token){

        if(token == null) {
            Log.e(LOG_TAG, "Login failed");
            loginFailed.setVisibility(View.VISIBLE);
            return;
        }

        Log.d(LOG_TAG, "Login successful");
        Log.d(LOG_TAG, "Token : " + token);

        AppState.getInstance().setOAuthToken(token);

        //*
        // Actual code that should be in the app
        Intent intent = new Intent(this, ProfileActivity.class);
        intent.putExtra("id", -1); // -1 for current user
        /*/
        // Enable this block for testing events
        Intent intent = new Intent(this, EventActivity.class);
        intent.putExtra("id", 1); // -1 for current user
        //*/
        startActivity(intent);
    }

    private class GetAccessTokenTask extends AsyncTask<String, Integer, String> {
        protected String doInBackground(String... auth) {
            String token = "";
            try {
                token = SkvallraApi.getToken(auth[0], auth[1]);
            }catch (IOException e) {
                return null;
            }
            return token;
        }

        protected void onProgressUpdate(Integer... progress) {
        }

        protected void onPostExecute(String result) {
            completeLogin(result);
        }
    }

}
