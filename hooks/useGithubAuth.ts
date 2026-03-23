import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, exchangeCodeAsync } from 'expo-auth-session';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { GITHUB_CONFIG } from '../constants/Config';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// GitHub OAuth endpoints
const discovery = {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    revocationEndpoint: 'https://github.com/settings/connections/applications',
};

export function useGithubAuth() {
    const { login } = useAuth();

    // Scheme must match the scheme inside app.json
    const redirectUri = makeRedirectUri({
        scheme: 'gitpush',
        preferLocalhost: false, // Set to false so it uses the actual Metro IP (e.g. exp://192.168.x.x:8081)
    });

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: GITHUB_CONFIG.clientId,
            scopes: GITHUB_CONFIG.scopes,
            redirectUri,
        },
        discovery
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { code } = response.params;

            // Log output to help debug redirect URL mismatches
            console.log('Redirect URI used:', redirectUri);
            console.log('Received Code:', code);

            if (GITHUB_CONFIG.clientId === 'YOUR_GITHUB_CLIENT_ID') {
                Alert.alert("Configuration Missing", "Please add your GitHub Client ID & Secret in constants/Config.ts");
                return;
            }

            // Exchange code for token
            exchangeCodeAsync(
                {
                    clientId: GITHUB_CONFIG.clientId,
                    clientSecret: GITHUB_CONFIG.clientSecret,
                    code,
                    redirectUri,
                },
                discovery
            ).then((tokenResponse) => {
                if (tokenResponse.accessToken) {
                    login(tokenResponse.accessToken);
                    console.log("Logged in successfully with token!");
                }
            }).catch(err => {
                console.error("Token exchange failed:", err);
                Alert.alert("Authentication Failed", "Failed to exchange authorization code for token. Check your Client ID, Secret, and Redirect URI.");
            });
        } else if (response?.type === 'error') {
            console.error("Auth error:", response.error);
            Alert.alert("Authentication Error", response.error?.message || "Something went wrong during the OAuth flow.");
        }
    }, [response]);

    return { request, promptAsync, redirectUri };
}
