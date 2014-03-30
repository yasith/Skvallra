package com.skvallra.utilities;

import com.skvallra.api.SkvallraService;

import retrofit.RequestInterceptor;
import retrofit.RestAdapter;

/**
 * Created by yasith on 2014-03-28.
 */
public class AppState {

    private static AppState instance;

    private String oAuthToken;
    private SkvallraService service;

    private AppState() {

        RequestInterceptor requestInterceptor = new RequestInterceptor() {
            @Override
            public void intercept(RequestFacade request) {
                request.addHeader("Authorization", "Bearer " + AppState.getInstance().getOAuthToken());
            }
        };

        RestAdapter restAdapter = new RestAdapter.Builder()
                .setEndpoint("http://skvallra.com/api")
                .setRequestInterceptor(requestInterceptor)
                .build();

        service = restAdapter.create(SkvallraService.class);
    }

    public static AppState getInstance() {
        if(instance == null) {
            instance = new AppState();
        }

        return instance;
    }

    public String getOAuthToken() {
        return oAuthToken;
    }

    public void setOAuthToken(String oAuthToken) {
        this.oAuthToken = oAuthToken;
    }

    public SkvallraService getService() {
        return service;
    }
}
