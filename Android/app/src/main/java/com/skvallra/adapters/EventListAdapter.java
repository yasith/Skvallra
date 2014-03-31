package com.skvallra.adapters;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.skvallra.utilities.AppState;
import com.skvallra.R;
import com.skvallra.api.Event;
import com.skvallra.api.Image;
import com.skvallra.api.SkvallraService;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

import butterknife.ButterKnife;
import butterknife.InjectView;

/**
 * Created by yasith on 2014-03-28.
 */
public class EventListAdapter extends ArrayAdapter<Event> {

    private static final String LOG_TAG = "Event List Adapter";

    private Context context;
    private Activity activity;
    private ArrayList<Event> eventList;

    @InjectView(R.id.event_title) TextView eventTitle;
    @InjectView(R.id.event_description) TextView eventDescription;
    @InjectView(R.id.event_image) ImageView eventImage;

    public EventListAdapter(Activity activity, ArrayList<Event> objects) {
        super(activity , R.layout.event_list, objects);
        eventList = objects;
        context = activity;
        this.activity = activity;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        if(convertView == null) {
            LayoutInflater inflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            convertView = inflater.inflate(R.layout.event_list, null);
        }

        ButterKnife.inject(convertView);

        final Event event = eventList.get(position);

        TextView tv;
        tv = (TextView)convertView.findViewById(R.id.event_title);
        tv.setText(event.getTitle());
        tv = (TextView)convertView.findViewById(R.id.event_description);
        tv.setText(event.getDescription());

        final ImageView iv = (ImageView) convertView.findViewById(R.id.event_image);

        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                getEventImage(event.getImage(), iv);
            }
        };
        new Thread(runnable).start();

        return convertView;
    }

    public void getEventImage(int imageId, final ImageView eventImage) {
        SkvallraService service = AppState.getInstance().getService();
        final Image image = service.getImage(imageId);

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Picasso.with(context).load(image.getImageUrl()).fit().centerCrop().into(eventImage);
            }
        });
    }

    public void addEvents(ArrayList<Event> newEvents) {
        Log.d(LOG_TAG, "Got " + newEvents.size() + " events ");

        eventList.clear();
        eventList.addAll(newEvents);

        for(Event event: eventList) {
            Log.d(LOG_TAG, event.getTitle());
        }

        notifyDataSetChanged();
    }

    public ArrayList<Event> getEventList() {
        return eventList;
    }
}
