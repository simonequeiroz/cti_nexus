package br.com.ctinexus.config;

import br.com.ctinexus.security.JwtFiltroAutenticacao;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// "Regras que determinam onde cada pessoa pode entrar" (slides 22 e 25). É o SecurityConfig da aula.
@Configuration // Classe de configuração: os métodos com @Bean criam objetos que o Spring usa no resto do sistema.
public class ConfiguracaoSeguranca {

    private final JwtFiltroAutenticacao jwtFiltro;
    private final List<String> origensPermitidas; // Endereços do front que podem chamar a API (CORS).

    public ConfiguracaoSeguranca(JwtFiltroAutenticacao jwtFiltro, @Value("${cors.origens}") List<String> origensPermitidas) {
        this.jwtFiltro = jwtFiltro;
        this.origensPermitidas = origensPermitidas;
    }

    @Bean
    public SecurityFilterChain filtros(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // CSRF protege formulários com cookie; com token no cabeçalho não é preciso.
                .cors(cors -> cors.configurationSource(cors())) // Deixa o front (outra porta/endereço) chamar a API.
                // STATELESS: o servidor não guarda sessão; cada requisição se identifica pelo token.
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(regras -> regras
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()                   // "Pré-consulta" do navegador (CORS).
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/cadastro", "/api/auth/esqueci-senha").permitAll() // Públicas.
                        .requestMatchers("/error").permitAll()                                    // Página de erro do Spring.
                        .requestMatchers("/api/admin/**").hasAuthority("gerenciar_usuarios")      // Só administrador.
                        .anyRequest().authenticated())                                           // O resto exige token.
                // Sem token (ou token inválido) -> 401. Com token, mas sem permissão -> 403 (padrão do Spring).
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                // Coloca o nosso filtro JWT antes do filtro de login padrão do Spring.
                .addFilterBefore(jwtFiltro, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // BCrypt: transforma "123456" em um hash tipo "$2a$10$..." que não dá para desfazer (slide 5).
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // CORS: o navegador só deixa o front em localhost:5173 (ou na Vercel) chamar a API em localhost:8080 se ela autorizar.
    private CorsConfigurationSource cors() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origensPermitidas);                                  // De onde pode chamar.
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")); // Quais métodos.
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));            // Quais cabeçalhos.

        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/**", config); // Vale para todas as rotas.
        return fonte;
    }
}
