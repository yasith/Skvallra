package com.skvallra.activities;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.skvallra.utilities.AppState;
import com.skvallra.R;
import com.skvallra.adapters.EventListAdapter;
import com.skvallra.adapters.ImageAdapter;
import com.skvallra.api.Event;
import com.skvallra.api.Image;
import com.skvallra.api.User;
import com.skvallra.api.SkvallraService;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

import butterknife.ButterKnife;
import butterknife.InjectView;


public class ProfileActivity extends Activity {

    private static final String LOG_TAG = "Profile Activity";
    @InjectView(R.id.profile_pic) ImageView profilePic;
    @InjectView(R.id.name) TextView nameText;
    @InjectView(R.id.email) TextView emailText;
    @InjectView(R.id.dob) TextView dobText;
    @InjectView(R.id.friend_grid) GridView friendsGrid;
    @InjectView(R.id.event_list) ListView eventList;
    @InjectView(R.id.interest_list) GridView interestList;

    private Context context;
    private int userId;
    private ArrayList<String> friendsImageList = new ArrayList<String>();
    private ArrayList<User> friendsList = new ArrayList<User>();

    private ArrayAdapter<String> interestAdapter;
    private EventListAdapter eventListAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        context = this;
        ButterKnife.inject(this);

        userId = getIntent().getIntExtra("id", -1);

        // Start a new thread to fetch profile information
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                getProfileInfo();
                getFriends();
                getEvents();
            }
        };
        new Thread(runnable).start();

        friendsGrid.setAdapter(new ImageAdapter(this));

        friendsGrid.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            public void onItemClick(AdapterView<?> parent, View v, int position, long id) {
                Toast.makeText(context, "" + position, Toast.LENGTH_SHORT).show();
                Intent intent = new Intent(context, ProfileActivity.class);
                intent.putExtra("id", friendsList.get(position).getId());

                startActivity(intent);
            }
        });

        ArrayList<String> vals = new ArrayList<String>();
        interestAdapter =  new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, android.R.id.text1, vals);
        interestList.setAdapter(interestAdapter);

        ArrayList<Event> eventVals = new ArrayList<Event>();
        eventListAdapter = new EventListAdapter(this, eventVals);
        eventList.setAdapter(eventListAdapter);

        eventList.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            public void onItemClick(AdapterView<?> parent, View v, int position, long id) {
                Toast.makeText(context, "" + position, Toast.LENGTH_SHORT).show();

                int eventId = eventListAdapter.getEventList().get(position).getId();
                Log.d(LOG_TAG, "Starting event screen with id " + eventId);
                Intent intent = new Intent(context, EventActivity.class);
                intent.putExtra("id", eventId);

                startActivity(intent);
            }
        });
    }

    private void getProfileInfo(){
        try {
            SkvallraService service = AppState.getInstance().getService();
            final User user;

            if(userId == -1) {
                user = service.me();
                userId = user.getId();
            }else {
                user = service.getUser(userId);
            }

            final Image image = service.getImage(user.getImage());

            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    nameText.setText(user.getFirstName() + " " + user.getLastName());
                    emailText.setText(user.getEmail());
                    dobText.setText(user.getBirthday().substring(0, 10));

                    Picasso.with(context).load(image.getImageUrl()).fit().centerCrop().into(profilePic);

                    for(String s: user.getInterests()) {
                        interestAdapter.insert(s, interestAdapter.getCount());
                    }
                    interestAdapter.notifyDataSetChanged();
                }
            });

        }catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void getFriends(){
        try{
            SkvallraService service = AppState.getInstance().getService();
            final User me = service.me();

            for(int id: me.getFriends()) {
                User friend = service.getUser(id);
                Image img = service.getImage(friend.getImage());
                friendsList.add(friend);
                friendsImageList.add(img.getImageUrl());
                Log.d(LOG_TAG, "Adding image " + img.getImageUrl());
            }

            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ImageAdapter imageAdapter = (ImageAdapter)friendsGrid.getAdapter();
                    imageAdapter.setImageUrls(friendsImageList);
                }
            });

        }catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void getEvents() {
        try {
            SkvallraService service = AppState.getInstance().getService();

            final ArrayList<Event> events = service.getEvents(userId);

            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    eventListAdapter.addEvents(events);
                }
            });

        } catch (Exception e){
            e.printStackTrace();
        }
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.profile, menu);
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

}
