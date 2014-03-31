package com.skvallra.api;


import com.google.gson.Gson;
import com.squareup.okhttp.OkHttpClient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Created by yasith on 2014-03-28.
 */
public class SkvallraApi {

    private static OkHttpClient client = new OkHttpClient();
    private static final String SKVALLRA_AUTH = "http://skvallra.com/oauth2/access_token";
    private static final String CLIENT_ID = "b54456c016e657c9c580";
    private static final String CLIENT_SECRET= "56e69e9d5e6962f532db25f2b5fe1dbc6966f5ab";

    public static String getToken(String key, String secret) throws IOException {
        String json = post(new URL(SKVALLRA_AUTH), createBody(key, secret).getBytes("UTF-8"));

        Gson gson = new Gson();
        Response response = gson.fromJson(json, Response.class);

        return response.access_token;
    }

    private static String createBody(String key, String secret){
        String body =
                "client_id=" + CLIENT_ID + "&" +
                "client_secret=" + CLIENT_SECRET + "&" +
                "grant_type=password&" +
                "username=" + key + "&" +
                "password=" + secret;

        return body;
    }

    private class Response {
        private String access_token;
        private String scope;
        private long expires_in;
        private String refresh_token;
    }

    /**
     * From OKHttp example by Square Inc.
     */
    private static String post(URL url, byte[] body) throws IOException {
        HttpURLConnection connection = client.open(url);
        OutputStream out = null;
        InputStream in = null;
        try {
            // Write the request.
            connection.setRequestMethod("POST");
            out = connection.getOutputStream();
            out.write(body);
            out.close();

            // Read the response.
            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                throw new IOException("Unexpected HTTP response: "
                        + connection.getResponseCode() + " " + connection.getResponseMessage() + " | " + connection.toString());
            }
            in = connection.getInputStream();
            return readFirstLine(in);
        } finally {
            // Clean up.
            if (out != null) out.close();
            if (in != null) in.close();
        }
    }

    /**
     * From OKHttp example by Square Inc.
     */
    private static String readFirstLine(InputStream in) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(in, "UTF-8"));
        return reader.readLine();
    }
}
