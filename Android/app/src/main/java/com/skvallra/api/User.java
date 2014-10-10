package com.skvallra.api;

/**
 * Created by yasith on 2014-03-28.
 */
public class User {
    private int id;
    private String username;
    private String first_name;
    private String last_name;
    private String birthday;
    private String email;
    private int image;
    private int[] friends;
    private String[] interests;

    public int getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getFirstName() {
        return first_name;
    }

    public String getLastName() {
        return last_name;
    }

    public String getBirthday() {
        return birthday;
    }

    public int getImage() {
        return image;
    }

    public String getEmail() {
        return email;
    }

    public int[] getFriends() {
        return friends;
    }

    public String[] getInterests() {
        return interests;
    }
}
