package br.com.ctinexus.dto;

// O que a API devolve no login: o token (o "crachá"), o tipo "Bearer" e os dados do usuário (slide 28).
// O front guarda o token no sessionStorage e o services/api.js manda em toda chamada.
public record LoginResponse(String token, String tipo, UsuarioResponse usuario) {

    public LoginResponse(String token, UsuarioResponse usuario) { // Atalho: o tipo é sempre "Bearer".
        this(token, "Bearer", usuario);
    }
}
