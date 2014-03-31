package com.skvallra.api;

/**
 * Created by yasith on 2014-03-28.
 */
public class Event {

    private int action_id;
    private String title;
    private String description;
    private String start_date;
    private String end_date;
    private String address;
    private int image;

    public int getId() {
        return action_id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getStartDate() {
        return start_date;
    }

    public String getEndDate() {
        return end_date;
    }

    public String getAddress() {
        return address;
    }

    public int getImage() {
        return image;
    }
}
