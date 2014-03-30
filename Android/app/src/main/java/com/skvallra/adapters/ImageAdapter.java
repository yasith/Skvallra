package com.skvallra.adapters;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.ListAdapter;

import com.squareup.picasso.Picasso;

import java.util.ArrayList;

/**
 * Created by yasith on 2014-03-28.
 */
public class ImageAdapter extends BaseAdapter {
    private Context context;
    private ArrayList<String> imageUrls;

    public ImageAdapter(Context context) {
        this.context = context;
        imageUrls = new ArrayList<String>();
    }


    @Override
    public int getCount() {
        return imageUrls.size();
    }

    @Override
    public Object getItem(int i) {
        return null;
    }

    @Override
    public long getItemId(int i) {
        return 0;
    }

    @Override
    public View getView(int i, View convertView, ViewGroup viewGroup) {

        ImageView imageView;
        if (convertView == null) {  // if it's not recycled, initialize some attributes
            imageView = new ImageView(context);
            imageView.setLayoutParams(new GridView.LayoutParams(85, 85));
            imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);
            imageView.setPadding(8, 8, 8, 8);
        } else {
            imageView = (ImageView) convertView;
        }

        String url = imageUrls.get(i);
        Picasso.with(context).load(url).fit().into(imageView);

        return imageView;
    }

    public void setImageUrls(ArrayList<String> urls) {
        imageUrls.clear();
        imageUrls.addAll(urls);
        notifyDataSetChanged();
    }
}
