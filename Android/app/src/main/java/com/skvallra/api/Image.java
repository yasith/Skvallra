package com.skvallra.api;

/**
 * Created by yasith on 2014-03-28.
 */
public class Image {
    private String image_hash;

    public String getImageUrl(){
        return "http://skvallra.com/static/skvallra/images/" + image_hash + ".png";
    }
}
