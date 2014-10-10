package com.skvallra.api;

import java.util.ArrayList;

import retrofit.http.GET;
import retrofit.http.Path;

/**
 * Created by yasith on 2014-03-28.
 */
public interface SkvallraService {

    @GET("/me")
    User me();

    @GET("/images/{id}")
    Image getImage(@Path("id") int id);

    @GET("/users/{id}")
    User getUser(@Path("id") int id);

    @GET("/user_actions/{id}")
    ArrayList<Event> getEvents(@Path("id") int id);

    @GET("/actions/{id}")
    Event getEvent(@Path("id") int id);
}
