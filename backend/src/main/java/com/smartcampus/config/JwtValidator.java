package com.smartcampus.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

import java.net.URL;

public class JwtValidator {

    private static final String JWKS_URL =
            "https://lcwywqhzfwsjqnusvbhw.supabase.co/auth/v1/.well-known/jwks.json";

    public static JWTClaimsSet validate(String token) throws Exception {

        ConfigurableJWTProcessor<SecurityContext> jwtProcessor =
                new DefaultJWTProcessor<>();

        JWKSource<SecurityContext> keySource =
                new RemoteJWKSet<>(new URL(JWKS_URL));

        JWSKeySelector<SecurityContext> keySelector =
                new JWSVerificationKeySelector<>(JWSAlgorithm.ES256, keySource);

        jwtProcessor.setJWSKeySelector(keySelector);

        return jwtProcessor.process(token, null);
    }
}