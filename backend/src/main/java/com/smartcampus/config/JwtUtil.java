package com.smartcampus.config;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jose.jwk.source.*;
import com.nimbusds.jose.proc.*;
import com.nimbusds.jose.*;
import com.nimbusds.jwt.proc.*;

import java.net.URL;

public class JwtUtil {

    private static final String JWKS_URL = "https://lcwywqhzfwsjqnusvbhw.supabase.co/auth/v1/.well-known/jwks.json";

    public static JWTClaimsSet validateToken(String token) throws Exception {

        ConfigurableJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();

        JWKSource<SecurityContext> keySource =
                new RemoteJWKSet<>(new URL(JWKS_URL));

        JWSAlgorithm expectedJWSAlg = JWSAlgorithm.ES256;

        JWSKeySelector<SecurityContext> keySelector =
                new JWSVerificationKeySelector<>(expectedJWSAlg, keySource);

        jwtProcessor.setJWSKeySelector(keySelector);

        return jwtProcessor.process(token, null);
    }
}