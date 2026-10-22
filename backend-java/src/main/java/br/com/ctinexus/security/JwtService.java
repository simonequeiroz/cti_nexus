package br.com.ctinexus.security;

import br.com.ctinexus.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

// Gera e confere os tokens JWT (slide 21). O token é o "crachá digital" entregue no login.
// Lembrete do slide 8: o token é ASSINADO, não criptografado. Qualquer um lê o conteúdo,
// por isso aqui só vão e-mail, id e papel. Nunca senha.
@Service
public class JwtService {

    private final SecretKey chave;          // Chave que assina (e confere) os tokens.
    private final long expiracaoMinutos;    // Quanto tempo o token vale.

    // @Value lê do application.properties (que lê das variáveis de ambiente).
    public JwtService(@Value("${jwt.segredo}") String segredoBase64,
                      @Value("${jwt.expiracao-minutos}") long expiracaoMinutos) {
        this.chave = Keys.hmacShaKeyFor(Decoders.BASE64.decode(segredoBase64)); // Base64 -> bytes -> chave HMAC.
        this.expiracaoMinutos = expiracaoMinutos;
    }

    // Monta o token: Header (algoritmo) + Payload (claims) + Signature (assinatura).
    public String gerarToken(Usuario usuario) {
        Date agora = new Date();
        Date expira = new Date(agora.getTime() + expiracaoMinutos * 60_000); // minutos -> milissegundos.

        return Jwts.builder()
                .subject(usuario.getEmail())                 // "sub": de quem é o crachá.
                .claim("id", usuario.getId())                // Dados extras (claims) no payload.
                .claim("papel", usuario.getPapel().name())
                .issuedAt(agora)                             // "iat": quando foi emitido.
                .expiration(expira)                          // "exp": quando vence.
                .signWith(chave)                             // Assina (HS256). Sem a chave, ninguém falsifica.
                .compact();                                  // Junta tudo no texto xxxxx.yyyyy.zzzzz
    }

    // Lê o e-mail de dentro do token. Se a assinatura não bate ou o token venceu, devolve null.
    public String extrairEmail(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(chave)       // Confere a assinatura com a nossa chave.
                    .build()
                    .parseSignedClaims(token) // Também confere a expiração.
                    .getPayload();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null; // Token inválido, alterado ou vencido.
        }
    }
}
