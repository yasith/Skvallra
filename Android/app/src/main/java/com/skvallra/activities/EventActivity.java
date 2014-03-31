package com.skvallra.activities;

import android.app.Activity;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentTabHost;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.ImageView;

import com.skvallra.R;
import com.skvallra.activities.fragments.EventCommentsFragment;
import com.skvallra.activities.fragments.EventDetailsFragment;
import com.skvallra.activities.fragments.EventUsersFragment;
import com.skvallra.api.Event;
import com.skvallra.api.Image;
import com.skvallra.api.SkvallraService;
import com.skvallra.utilities.AppState;
import com.squareup.picasso.Picasso;

import butterknife.ButterKnife;
import butterknife.InjectView;
import retrofit.RetrofitError;

public class EventActivity extends FragmentActivity implements EventDetailsFragment.OnFragmentInteractionListener, EventCommentsFragment.OnFragmentInteractionListener, EventUsersFragment.OnFragmentInteractionListener{

    private static final String LOG_TAG = "Event Activity";

    Context context;
    int eventId;

    @InjectView(R.id.event_image) ImageView eventImage;
    private FragmentTabHost tabHost;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_event);

        eventId = getIntent().getIntExtra("id", -1);

        ButterKnife.inject(this);

        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                getEventDetails();
            }
        };
        new Thread(runnable).start();

        tabHost = (FragmentTabHost) findViewById(R.id.tab_host);
        if(tabHost == null) {
            Log.e(LOG_TAG, "TAB HOST IS NULL YO");
        }
        tabHost.setup(this, getSupportFragmentManager(), R.id.tab_fragment);
        tabHost.addTab(tabHost.newTabSpec("details").setIndicator("DETAILS"), EventDetailsFragment.class, null);
        tabHost.addTab(tabHost.newTabSpec("people").setIndicator("MAP"), EventUsersFragment.class, null);
        tabHost.addTab(tabHost.newTabSpec("comments").setIndicator("COMMENTS"), EventCommentsFragment.class, null);

    }

    public void getEventDetails() {
        try {
            SkvallraService service = AppState.getInstance().getService();

            final Event event = service.getEvent(eventId);
            final Image image = service.getImage(event.getImage());

            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Picasso.with(context).load(image.getImageUrl()).fit().centerCrop().into(eventImage);
                    setTitle(event.getTitle());
                }
            });
        }catch (RetrofitError e) {
            e.printStackTrace();
            Log.e(LOG_TAG, "Message " + e.getMessage());
            Log.e(LOG_TAG, "Body " + e.getBody().toString());
        }
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.event, menu);
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

    @Override
    public void onFragmentInteraction(Uri uri) {

    }
}
