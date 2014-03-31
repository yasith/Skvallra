package com.skvallra.activities.fragments;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.GridView;
import android.widget.TextView;
import android.widget.Toast;

import com.skvallra.R;
import com.skvallra.activities.ProfileActivity;
import com.skvallra.adapters.ImageAdapter;
import com.skvallra.api.Event;
import com.skvallra.api.Image;
import com.skvallra.api.SkvallraService;
import com.skvallra.api.User;
import com.skvallra.utilities.AppState;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;

import butterknife.ButterKnife;
import butterknife.InjectView;
import retrofit.RetrofitError;

/**
 * A simple {@link android.support.v4.app.Fragment} subclass.
 * Activities that contain this fragment must implement the
 * {@link EventDetailsFragment.OnFragmentInteractionListener} interface
 * to handle interaction events.
 * Use the {@link EventDetailsFragment#newInstance} factory method to
 * create an instance of this fragment.
 *
 */
public class EventDetailsFragment extends Fragment{
    // TODO: Rename parameter arguments, choose names that match
    // the fragment initialization parameters, e.g. ARG_ITEM_NUMBER
    private static final String ARG_PARAM1 = "param1";
    private static final String ARG_PARAM2 = "param2";
    private static final String LOG_TAG = "Event Details Fragment";

    @InjectView(R.id.event_date) TextView eventDate;
    @InjectView(R.id.event_description) TextView eventDescription;
    @InjectView(R.id.event_end_date) TextView eventEndDate;
    @InjectView(R.id.user_grid) GridView userGrid;

    // TODO: Rename and change types of parameters
    private String mParam1;
    private String mParam2;


    private ArrayList<String> userImageList = new ArrayList<String>();
    private ArrayList<User> userList = new ArrayList<User>();


    private OnFragmentInteractionListener mListener;
    private Context context;
    int eventId;

    /**
     * Use this factory method to create a new instance of
     * this fragment using the provided parameters.
     *
     * @param param1 Parameter 1.
     * @param param2 Parameter 2.
     * @return A new instance of fragment EventDetailsFragment.
     */
    // TODO: Rename and change types and number of parameters
    public static EventDetailsFragment newInstance(String param1, String param2) {
        EventDetailsFragment fragment = new EventDetailsFragment();
        Bundle args = new Bundle();
        args.putString(ARG_PARAM1, param1);
        args.putString(ARG_PARAM2, param2);
        fragment.setArguments(args);
        return fragment;
    }
    public EventDetailsFragment() {
        // Required empty public constructor
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        context = this.getActivity();
        eventId = this.getActivity().getIntent().getIntExtra("id", -1);

        if (getArguments() != null) {
            mParam1 = getArguments().getString(ARG_PARAM1);
            mParam2 = getArguments().getString(ARG_PARAM2);
        }

    }
     public void getEventDetails() {
        try {
            SkvallraService service = AppState.getInstance().getService();

            final Event event = service.getEvent(eventId);

            this.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    eventDate.setText(event.getStartDate().substring(0, 10));
                    eventEndDate.setText(event.getEndDate().substring(0, 10));
                    eventDescription.setText(event.getDescription());
                }
            });
        }catch (Exception e) {
            e.printStackTrace();
        }
    }
    private void getUsers(){
        try{
            SkvallraService service = AppState.getInstance().getService();
            final User me = service.me();

            for(int id: me.getFriends()) {
                User friend = service.getUser(id);
                Image img = service.getImage(friend.getImage());
                userList.add(friend);
                userImageList.add(img.getImageUrl());
                Log.d(LOG_TAG, "Adding image " + img.getImageUrl());
            }

            this.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    ImageAdapter imageAdapter = (ImageAdapter) userGrid.getAdapter();
                    imageAdapter.setImageUrls(userImageList);
                }
            });

        }catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view  = inflater.inflate(R.layout.fragment_event_details, container, false);
        ButterKnife.inject(this, view);

        userGrid.setAdapter(new ImageAdapter(this.getActivity()));

        userGrid.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            public void onItemClick(AdapterView<?> parent, View v, int position, long id) {
                Intent intent = new Intent(context, ProfileActivity.class);
                intent.putExtra("id", userList.get(position).getId());

                startActivity(intent);
            }
        });

        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                getEventDetails();
                getUsers();
            }
        };
        new Thread(runnable).start();

        return view;
    }

    // TODO: Rename method, update argument and hook method into UI event
    public void onButtonPressed(Uri uri) {
        if (mListener != null) {
            mListener.onFragmentInteraction(uri);
        }
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        try {
            mListener = (OnFragmentInteractionListener) activity;
        } catch (ClassCastException e) {
            throw new ClassCastException(activity.toString()
                    + " must implement OnFragmentInteractionListener");
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
        mListener = null;
    }

    /**
     * This interface must be implemented by activities that contain this
     * fragment to allow an interaction in this fragment to be communicated
     * to the activity and potentially other fragments contained in that
     * activity.
     * <p>
     * See the Android Training lesson <a href=
     * "http://developer.android.com/training/basics/fragments/communicating.html"
     * >Communicating with Other Fragments</a> for more information.
     */
    public interface OnFragmentInteractionListener {
        // TODO: Update argument type and name
        public void onFragmentInteraction(Uri uri);
    }

}
